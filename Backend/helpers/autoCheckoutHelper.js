import cron from "node-cron";
import attendanceModel from "../models/attendanceModel.js";
import Employee from "../models/EmployeeModel.js"; 

export const startAutoCheckoutJob = () => {
    
    // 1. MARK ABSENT AT 10:00 AM (SL Time)
    cron.schedule("00 10 * * *", async () => {
        console.log(" [CRON] Running 10:00 AM Absent Check...");

        try {
            const now = new Date();
            const slTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
            const todayStr = slTime.toISOString().split("T")[0];

            // Get ALL Employees (Role 1) from Employee Table
            const allEmployees = await Employee.find({ role: 1 }).select("_id");

            //  Get everyone who has ALREADY clocked in today
            const presentAttendance = await attendanceModel.find({ date: todayStr }).select("userId");
            const presentIds = presentAttendance.map(record => record.userId.toString());

            // Find Employees who are NOT in the present list
            const absentEmployees = allEmployees.filter(emp => !presentIds.includes(emp._id.toString()));

            if (absentEmployees.length === 0) {
                console.log(" [CRON] All employees are present today!");
                return;
            }

            console.log(` [CRON] Found ${absentEmployees.length} employees absent at 10:00 AM.`);

            // Mark them Absent using their EMPLOYEE ID
            const absentRecords = absentEmployees.map(emp => ({
                userId: emp._id, // Saving Employee ID
                date: todayStr,
                status: "Absent",
                inTime: null,
                outTime: null 
            }));

            if (absentRecords.length > 0) {
                await attendanceModel.insertMany(absentRecords);
                console.log(" [CRON] Marked missing employees as Absent.");
            }

        } catch (error) {
            console.error(" [CRON] Error in Absent Check:", error);
        }
    });

    // 2. AUTO CHECKOUT AT 7:30 PM
    cron.schedule("30 19 * * *", async () => {
        console.log(" [CRON] Running Auto Check-Out Job...");

        try {
            const now = new Date();
            const slTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
            const todayStr = slTime.toISOString().split("T")[0];

        
            const forgotToCheckoutEmployees = await attendanceModel.find({
                date: todayStr,
                outTime: null, 
                status: { $ne: "Absent" } 
            });

            if (forgotToCheckoutEmployees.length === 0) {
                console.log(" [CRON] No employees found who forgot to checkout.");
                return;
            }

            console.log(` [CRON] Found ${forgotToCheckoutEmployees.length} employees to auto-checkout.`);

            for (const record of forgotToCheckoutEmployees) {
                const autoOutTime = new Date();
                autoOutTime.setHours(13, 0, 0, 0); // 1:00 PM
                record.outTime = autoOutTime;
    
                if (record.inTime) {
                    const inTimeSL = new Date(record.inTime).toLocaleString("en-US", { timeZone: "Asia/Colombo" });
                    const inHour = new Date(inTimeSL).getHours(); 

                    if (inHour < 9) record.status = "Present";
                    else if (inHour === 9) record.status = "Late";
                    else record.status = "Absent";
                }
                
                await record.save();
                console.log(`   -> Auto-checked out Employee ID: ${record.userId} | Status: ${record.status}`);
            }
            console.log(" [CRON] Auto Check-Out Complete.");

        } catch (error) {
            console.error(" [CRON] Error in auto checkout:", error);
        }
    });
};
