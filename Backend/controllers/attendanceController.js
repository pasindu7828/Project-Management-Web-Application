import attendanceModel from "../models/attendanceModel.js";
import Employee from "../models/EmployeeModel.js"; 
import ExcelJS from 'exceljs';       
import PDFDocument from 'pdfkit';    


// Calculate "0h 0m" format
const calculateDuration = (inTime, outTime) => {
    if (!inTime || !outTime) return "-";
    const start = new Date(inTime);
    const end = new Date(outTime);
    const diffMs = end - start;
    if (diffMs < 0) return "Error"; 
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};

// Get Status Based on SL Time
const determineStatus = () => {
    const now = new Date();
    const slTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Colombo" });
    const slDate = new Date(slTimeStr);
    
    const hours = slDate.getHours();
    const minutes = slDate.getMinutes();

    if (hours < 9) return "Present"; 
    if (hours === 9 && minutes === 0) return "Present"; 
    if (hours === 9 || (hours === 10 && minutes === 0)) return "Late"; 

    return "Absent"; 
};

// Helper to get Employee ID (Strictly Employee Table)
const getEmployeeIdFromUser = async (idFromToken) => {
    const directEmployee = await Employee.findById(idFromToken);
    if (directEmployee) {
        return directEmployee._id;
    }
    return null;
};



// 1. START ATTENDANT (Clock In)
export const clockInController = async (req, res) => {
    try {
        const { date } = req.body; 
        const idFromToken = req.user.userid; 

        if (!date) return res.status(400).send({ message: "Date is required" });

        const employeeId = await getEmployeeIdFromUser(idFromToken);
        
        if (!employeeId) {
            return res.status(404).send({ success: false, message: "Employee profile not found. Please contact HR." });
        }

        let attendance = await attendanceModel.findOne({ userId: employeeId, date });
        const calculatedStatus = determineStatus(); 

        if (attendance) {
            if (attendance.inTime === null || attendance.status === 'Absent') {
                attendance.inTime = new Date(); 
                attendance.status = calculatedStatus; 
                await attendance.save();
                return res.status(200).send({
                    success: true,
                    message: `Check In Successful (Overwrote Absent). Status: ${calculatedStatus}`,
                    attendance
                });
            } else {
                return res.status(400).send({
                    success: false,
                    message: "You have already clocked in for this date."
                });
            }
        }

        const newAttendance = new attendanceModel({
            userId: employeeId, 
            date,
            status: calculatedStatus,
            inTime: new Date()
        });
        await newAttendance.save();

        res.status(201).send({
            success: true,
            message: `Check In Successful. Status: ${calculatedStatus}`,
            newAttendance
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error in Check In API", error });
    }
};

// 2. END ATTENDANCE (Clock Out)
export const clockOutController = async (req, res) => {
    try {
        const { date } = req.body;
        const idFromToken = req.user.userid; 

        const employeeId = await getEmployeeIdFromUser(idFromToken);
        if (!employeeId) return res.status(404).send({ message: "Employee profile not found" });

        const attendance = await attendanceModel.findOne({ userId: employeeId, date });

        if (!attendance) {
            return res.status(404).send({ success: false, message: "Attendance record not found for today" });
        }
        if (attendance.outTime) {
            return res.status(400).send({ success: false, message: "You have already Checked Out today" });
        }

        attendance.outTime = new Date();
        await attendance.save();

        res.status(200).send({
            success: true,
            message: "Check Out Successful",
            attendance
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error in Clock Out API", error });
    }
};

// 3. GET ATTENDANT (Admin/Manager)
export const getAttendanceController = async (req, res) => {
    try {
        const { role, userid } = req.user;
        const { viewType, date } = req.query; 

        let query = {};

        if (role === 3) { 
            // Admin sees all
        } else if (role === 2) { 
            const employees = await Employee.find({ role: 1 }).select("_id");
            const allowedIds = employees.map(emp => emp._id);
            const managerEmpId = await getEmployeeIdFromUser(userid);
            if (managerEmpId) allowedIds.push(managerEmpId);
            query.userId = { $in: allowedIds };
        } else { 
            const employeeId = await getEmployeeIdFromUser(userid);
            if(employeeId) query.userId = employeeId;
            else return res.status(200).send({ success: true, count: 0, attendance: [] }); 
        }

        const targetDate = date ? new Date(date) : new Date(); 
        if (viewType === 'month') {
            const yearMonth = targetDate.toISOString().slice(0, 7); 
            query.date = { $regex: `^${yearMonth}` };
        } else if (viewType === 'week') { 
            const currentDay = targetDate.getDay(); 
            const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
            const startOfWeek = new Date(targetDate);
            startOfWeek.setDate(targetDate.getDate() - diffToMonday);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); 
            query.date = { $gte: startOfWeek.toISOString().split('T')[0], $lte: endOfWeek.toISOString().split('T')[0] };
        } else if (viewType === 'daily') {
            query.date = targetDate.toISOString().split('T')[0];
        }

        const attendanceRecords = await attendanceModel.find(query)
            .populate('userId', 'FirstName LastName email role employeeId')
            .sort({ date: -1 })
            .lean(); 

        const enrichedAttendance = attendanceRecords.map(record => {
            let displayStatus = record.status;
            if (record.inTime && !record.outTime) {
                displayStatus = "Working";
            }
            
            const user = record.userId || {};
            let fullName = "Unknown";

            
            if (user.FirstName && user.LastName) {
                fullName = `${user.FirstName} ${user.LastName}`;
            } else if (user.email) {
                fullName = user.email;
            }

            return { 
                ...record, 
                userId: { ...user, name: fullName }, 
                status: displayStatus,
                hoursWorked: calculateDuration(record.inTime, record.outTime) 
            }; 
        });

        res.status(200).send({
            success: true,
            count: enrichedAttendance.length,
            attendance: enrichedAttendance 
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in getting attendance", error });
    }
};

// 4. GET SINGLE USER ATTENDANCE 
export const getSingleUserAttendanceController = async (req, res) => {
    try {
        const { id } = req.params; 
        const attendanceRecords = await attendanceModel.find({ userId: id })
            .populate('userId', 'FirstName LastName email') 
            .sort({ date: -1 })
            .lean();

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.status(404).send({ success: false, message: "No records found for this user" });
        }

        const enrichedAttendance = attendanceRecords.map(record => {
            let displayStatus = record.status;
            if (record.inTime && !record.outTime) displayStatus = "Working";
            const user = record.userId || {};
            let fullName = "Unknown";
            
            if (user.FirstName && user.LastName) fullName = `${user.FirstName} ${user.LastName}`;
            else if (user.email) fullName = user.email;

            return { 
                ...record, 
                userId: { ...user, name: fullName },
                status: displayStatus,
                hoursWorked: calculateDuration(record.inTime, record.outTime) 
            }; 
        });

        res.status(200).send({
            success: true,
            count: enrichedAttendance.length,
            attendance: enrichedAttendance
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching user attendance", error });
    }
};

// 5. ATTENDANCE REPORT (Excel/PDF)
const buildExportQuery = async (req) => {
    const { role, userid } = req.user;
    const { viewType, date } = req.query; 
    let query = {};
    if (role === 3) {
    } else if (role === 2) {
        const employees = await Employee.find({ role: 1 }).select("_id");
        const allowedIds = employees.map(emp => emp._id);
        const managerEmpId = await getEmployeeIdFromUser(userid);
        if (managerEmpId) allowedIds.push(managerEmpId);
        query.userId = { $in: allowedIds };
    } else {
        const employeeId = await getEmployeeIdFromUser(userid);
        if(employeeId) query.userId = employeeId;
    }
    const targetDate = date ? new Date(date) : new Date();
    if (viewType === 'month') {
        const yearMonth = targetDate.toISOString().slice(0, 7); 
        query.date = { $regex: `^${yearMonth}` };
    } else if (viewType === 'week') { 
        const currentDay = targetDate.getDay(); 
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - diffToMonday);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); 
        query.date = { $gte: startOfWeek.toISOString().split('T')[0], $lte: endOfWeek.toISOString().split('T')[0] };
    } else if (viewType === 'daily') {
        query.date = targetDate.toISOString().split('T')[0];
    }
    return query;
};

export const generateAttendanceReport = async (req, res) => {
    try {
        const { type } = req.query; 
        if (type === 'pdf') {
            return exportAttendancePDF(req, res);
        } else {
            return exportAttendanceExcel(req, res);
        }
    } catch (error) {
         res.status(500).send({ message: "Error generating report" });
    }
};

const exportAttendanceExcel = async (req, res) => {
    try {
        const query = await buildExportQuery(req);
        const attendanceData = await attendanceModel.find(query)
            .populate('userId', 'FirstName LastName email employeeId _id') 
            .sort({ date: -1 });

        let totalHoursWorked = 0; 
        let daysPresent = 0;

        attendanceData.forEach(record => {
            if (record.status === 'Present' || record.status === 'Late') daysPresent++;
            if (record.inTime && record.outTime) {
                const start = new Date(record.inTime);
                const end = new Date(record.outTime);
                const hours = (end - start) / (1000 * 60 * 60); 
                totalHoursWorked += hours;
            }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'ID', key: 'empId', width: 15 },
            { header: 'Employee Name', key: 'name', width: 25 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Check In', key: 'inTime', width: 15 },
            { header: 'Check Out', key: 'outTime', width: 15 },
            { header: 'Hours', key: 'hours', width: 15 }
        ];

        const formatSLTime = (date) => {
            if (!date) return '-';
            return new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Colombo', timeStyle: 'short', hour12: true });
        };

        attendanceData.forEach(record => {
            let uniqueId = "Unknown";
            let fullName = "Unknown";
            
            if (record.userId) {
                
                if (record.userId.employeeId) {
                    uniqueId = record.userId.employeeId;
                } else if (record.userId._id) {
                    const shortId = record.userId._id.toString().slice(-4).toUpperCase();
                    uniqueId = `EMP-${shortId}`;
                }

                
                if (record.userId.FirstName && record.userId.LastName) {
                    fullName = `${record.userId.FirstName} ${record.userId.LastName}`;
                } else if (record.userId.email) {
                    fullName = record.userId.email; 
                }
            }

            worksheet.addRow({
                date: record.date,
                empId: uniqueId, 
                name: fullName, 
                status: record.status,
                inTime: formatSLTime(record.inTime),
                outTime: formatSLTime(record.outTime),
                hours: calculateDuration(record.inTime, record.outTime)
            });
        });

        worksheet.addRow([]); 
        worksheet.addRow(['SUMMARY REPORT']);
        worksheet.addRow(['Total Presents', daysPresent]);
        worksheet.addRow(['Total Hours Worked', totalHoursWorked.toFixed(2)]);
        
        const filename = `Attendance_Report.xlsx`;
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error exporting Excel", error });
    }
};

const exportAttendancePDF = async (req, res) => {
    try {
        const query = await buildExportQuery(req);
        const attendanceData = await attendanceModel.find(query)
            .populate('userId', 'FirstName LastName email employeeId _id')
            .sort({ date: -1 });

        let totalHoursWorked = 0;
        let daysPresent = 0;

        attendanceData.forEach(record => {
            if (record.status === 'Present' || record.status === 'Late') daysPresent++;
            if (record.inTime && record.outTime) {
                const start = new Date(record.inTime);
                const end = new Date(record.outTime);
                const hours = (end - start) / (1000 * 60 * 60);
                totalHoursWorked += hours;
            }
        });

        const doc = new PDFDocument({ margin: 30 });
        const filename = `Attendance_Report.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        doc.pipe(res);

        doc.fontSize(20).text("Attendance Report - WorkSync", { align: 'center' });
        doc.moveDown();

        const formatSLTime = (date) => {
            if (!date) return '-';
            return new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Colombo', hour12: true, hour: '2-digit', minute: '2-digit' });
        };

        doc.fontSize(10);
        let y = doc.y;
        doc.text("Date", 30, y);
        doc.text("ID", 110, y);
        doc.text("Name", 160, y);
        doc.text("In", 300, y);
        doc.text("Out", 360, y);
        doc.text("Hours", 420, y);
        doc.text("Status", 480, y);
        
        doc.moveDown(0.5);
        doc.moveTo(30, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        attendanceData.forEach((record) => {
            y = doc.y;
            const hoursTxt = calculateDuration(record.inTime, record.outTime);
            let uniqueId = "Unknown";
            let fullName = "Unknown";

            if (record.userId) {
                if (record.userId.employeeId) {
                    uniqueId = record.userId.employeeId;
                } else if (record.userId._id) {
                    const shortId = record.userId._id.toString().slice(-4).toUpperCase();
                    uniqueId = `EMP-${shortId}`;
                }

                if (record.userId.FirstName && record.userId.LastName) {
                    fullName = `${record.userId.FirstName} ${record.userId.LastName}`;
                } else if (record.userId.email) {
                    fullName = record.userId.email; 
                }
            }

            doc.text(record.date, 30, y);
            doc.text(uniqueId, 110, y);
            doc.text(fullName, 160, y, { width: 130 }); 
            doc.text(formatSLTime(record.inTime), 300, y);
            doc.text(formatSLTime(record.outTime), 360, y);
            doc.text(hoursTxt, 420, y);
            
            if(record.status === 'Absent') doc.fillColor('red');
            else if(record.status === 'Late') doc.fillColor('orange');
            else doc.fillColor('green');
            
            doc.text(record.status, 480, y);
            doc.fillColor('black'); 
            doc.moveDown();
        });

        doc.moveDown();
        doc.text("---------------------------------------------------");
        doc.fontSize(12).text(`Total Days Present: ${daysPresent}`);
        doc.fontSize(12).text(`Total Hours Worked: ${totalHoursWorked.toFixed(2)}`);
        doc.end();
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error exporting PDF", error });
    }
};

// 6. UPDATE ATTENDANCE (Admin Fix)
export const updateAttendanceController = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const { outTime, status } = req.body;
        const attendance = await attendanceModel.findById(attendanceId);

        if (!attendance) return res.status(404).send({ success: false, message: "Attendance record not found" });

        if (status) attendance.status = status;
        if (outTime) {
            const newOutTime = new Date(outTime);
            if (newOutTime < attendance.inTime) return res.status(400).send({ success: false, message: "Out Time cannot be before In Time!" });
            attendance.outTime = newOutTime;
        }

        await attendance.save();
        res.status(200).send({ success: true, message: "Attendance Updated Successfully", attendance });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error updating attendance", error });
    }
};

// 7. EMPLOYEE: REQUEST CORRECTION
export const requestCorrectionController = async (req, res) => {
    try {
        const idFromToken = req.user.userid;
        const { date, type, requestedTime, reason } = req.body; 

        const employeeId = await getEmployeeIdFromUser(idFromToken);
        if(!employeeId) return res.status(404).send({ success: false, message: "Employee profile not found" });

        const attendance = await attendanceModel.findOne({ userId: employeeId, date });
        if (!attendance) {
            return res.status(404).send({ success: false, message: "Attendance record not found for this date" });
        }

        attendance.correction = {
            isRequested: true,
            requestType: type,
            requestedTime: new Date(requestedTime),
            reason: reason,
            status: 'Pending'
        };

        await attendance.save();
        res.status(200).send({
            success: true,
            message: "Correction Request Sent Successfully",
            attendance
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error in requesting correction", error });
    }
};

// 8. ADMIN: GET ALL PENDING REQUESTS
export const getPendingCorrectionsController = async (req, res) => {
    try {
        const pendingRequests = await attendanceModel.find({ "correction.status": "Pending" })
            .populate("userId", "FirstName LastName email") 
            .sort({ date: -1 });

        res.status(200).send({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching requests", error });
    }
};

// 9. ADMIN: APPROVE OR REJECT CORRECTION
export const approveCorrectionController = async (req, res) => {
    try {
        const { attendanceId, action } = req.body; 
        const attendance = await attendanceModel.findById(attendanceId);

        if (!attendance) return res.status(404).send({ success: false, message: "Record not found" });

        if (action === "Reject") {
            attendance.correction.status = "Rejected";
            await attendance.save();
            return res.status(200).send({ success: true, message: "Request Rejected" });
        }

        if (action === "Approve") {
            if (attendance.correction.requestType === "CheckIn") {
                attendance.inTime = attendance.correction.requestedTime;
            } else if (attendance.correction.requestType === "CheckOut") {
                attendance.outTime = attendance.correction.requestedTime;
            }

            if (attendance.inTime && attendance.outTime) {
                const start = new Date(attendance.inTime);
                const end = new Date(attendance.outTime);
                if (start > end) {
                    return res.status(400).send({ 
                        success: false, 
                        message: "Error: Check-In time cannot be after Check-Out time!" 
                    });
                }
            }

            if (attendance.inTime) {
                const inTimeSL = new Date(attendance.inTime).toLocaleString("en-US", { timeZone: "Asia/Colombo" });
                const inHour = new Date(inTimeSL).getHours();
                if (inHour < 9) attendance.status = "Present";
                else if (inHour === 9) attendance.status = "Late";
                else attendance.status = "Absent";
            }

            attendance.correction.status = "Approved";
            await attendance.save();
            
            return res.status(200).send({ 
                success: true, 
                message: "Request Approved & Attendance Updated", 
                attendance 
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error processing request", error });
    }
};

// 10. GET USER ATTENDANCE HISTORY
export const getMyAttendanceHistoryController = async (req, res) => {
    try {
        const idFromToken = req.user.userid; 
        const employeeId = await getEmployeeIdFromUser(idFromToken);
        if (!employeeId) return res.status(200).send({ success: true, count: 0, attendance: [] });

        const attendanceRecords = await attendanceModel.find({ userId: employeeId })
            .sort({ date: -1 }) 
            .lean();

        const enrichedAttendance = attendanceRecords.map(record => {
            let displayStatus = record.status;
            if (record.inTime && !record.outTime) displayStatus = "Working";
            return { 
                ...record, 
                status: displayStatus,
                hoursWorked: calculateDuration(record.inTime, record.outTime) 
            }; 
        });

        res.status(200).send({
            success: true,
            count: enrichedAttendance.length,
            attendance: enrichedAttendance
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching history", error });
    }
};

// 11. GET DASHBOARD STATS
export const getDashboardStatsController = async (req, res) => {
    try {
        const now = new Date();
        const slTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
        const todayStr = slTime.toISOString().split("T")[0];

        const employees = await Employee.find({ role: 1 }).select('_id');
        const employeeIds = employees.map(emp => emp._id);
        const totalEmployees = employees.length;

        const todayAttendance = await attendanceModel.find({ 
            date: todayStr,
            userId: { $in: employeeIds } 
        });

        const presentCount = todayAttendance.filter(doc => doc.status === "Present").length;
        const lateCount = todayAttendance.filter(doc => doc.status === "Late").length;
        const absentCount = todayAttendance.filter(doc => doc.status === "Absent").length;

        res.status(200).send({
            success: true,
            stats: {
                totalEmployees,
                present: presentCount,
                late: lateCount,
                absent: absentCount 
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching dashboard stats", error });
    }
};

// 12. GET ANALYTICS REPORT
export const getAnalyticsReportController = async (req, res) => {
    try {
        const { type, date } = req.query; 
        const targetDate = date ? new Date(date) : new Date();
        let startDate, endDate;

        if (type === 'month') {
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        } else {
            const day = targetDate.getDay();
            const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); 
            startDate = new Date(targetDate.setDate(diff));
            startDate.setHours(0,0,0,0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23,59,59,999);
        }

        let workingDaysCount = 0;
        let loopDate = new Date(startDate);
        while (loopDate <= endDate) {
            const dayOfWeek = loopDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDaysCount++;
            loopDate.setDate(loopDate.getDate() + 1);
        }

        const employees = await Employee.find({ role: 1 }).select('_id FirstName LastName');
        
        const attendanceRecords = await attendanceModel.find({
            date: {
                $gte: startDate.toISOString().split('T')[0],
                $lte: endDate.toISOString().split('T')[0]
            }
        });

        let mostLateUser = { name: "None", count: -1 };
        let mostAbsentUser = { name: "None", count: -1 };
        let mostPresentUser = { name: "None", count: -1 }; 

        const reportData = employees.map(emp => {
            const empRecords = attendanceRecords.filter(r => r.userId.toString() === emp._id.toString());
            let daysPresent = 0;
            let daysAbsent = 0;
            let lateCount = 0;
            let totalMs = 0;

            empRecords.forEach(record => {
                if (record.status === 'Present' || record.status === 'Late') daysPresent++;
                if (record.status === 'Absent') daysAbsent++;
                if (record.status === 'Late') lateCount++;
                if (record.inTime && record.outTime) {
                    totalMs += (new Date(record.outTime) - new Date(record.inTime));
                }
            });

            const fullName = `${emp.FirstName} ${emp.LastName}`;
            if (lateCount > mostLateUser.count) mostLateUser = { name: fullName, count: lateCount };
            if (daysAbsent > mostAbsentUser.count) mostAbsentUser = { name: fullName, count: daysAbsent };
            if (daysPresent > mostPresentUser.count) mostPresentUser = { name: fullName, count: daysPresent };

            const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
            const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

        
            const shortId = emp._id.toString().slice(-4).toUpperCase();

            return {
                id: emp._id,
                employeeId: `EMP-${shortId}`, 
                name: fullName, 
                daysPresent,
                daysAbsent,
                lateCount,
                totalHours: `${totalHours}h ${totalMinutes}m`
            };
        });

        res.status(200).send({
            success: true,
            summary: {
                totalEmployees: employees.length,
                workingDays: workingDaysCount,
                mostLate: mostLateUser.count > 0 ? mostLateUser.name : "-",
                mostAbsent: mostAbsentUser.count > 0 ? mostAbsentUser.name : "-",
                mostPresent: mostPresentUser.count > 0 ? mostPresentUser.name : "-"
            },
            report: reportData
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error generating analytics", error });
    }
};