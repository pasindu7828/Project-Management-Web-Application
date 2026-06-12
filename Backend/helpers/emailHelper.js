// Native fetch is available globally in Node.js 18+


export const sendLeaveStatusEmail = async (recipientEmail, recipientName, status) => {


    try {
        const senderName = process.env.EMAIL_SENDER_NAME;
        const senderEmail = process.env.EMAIL_SENDER_ADDRESS;
        const apiKey = process.env.BREVO_API_KEY_1;
        const apiUrl = process.env.BREVO_API_URL;

        if (!apiKey || !senderEmail) {
            console.error("Missing Email Configuration: API Key or Sender Email not found in .env");
            return;
        }

        const subject = `Leave Request Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`;

        // Professional HTML Template
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                    .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { padding: 20px; }
                    .footer { margin-top: 20px; font-size: 0.8em; text-align: center; color: #777; }
                    .status { font-weight: bold; color: ${status === 'approved' ? '#4CAF50' : '#F44336'}; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Leave Request Update</h2>
                    </div>
                    <div class="content">
                        <p>Dear ${recipientName},</p>
                        <p>Your leave request has been <span class="status">${status.toUpperCase()}</span>.</p>
                        <p>Please log in to your portal to view more details.</p>
                        <br>
                        <p>Best regards,</p>
                        <p><strong>WorkSync HR Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const payload = {
            sender: {
                name: senderName,
                email: senderEmail
            },
            to: [
                {
                    email: recipientEmail,
                    name: recipientName
                }
            ],
            subject: subject,
            htmlContent: htmlContent
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey,
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log(`Email sent successfully to ${recipientEmail}`);
        } else {
            const errorData = await response.json();
            console.error("Failed to send email:", errorData);
        }

    } catch (error) {
        console.error("Error sending email:", error);
    }
};

export const sendHighPriorityTaskEmail = async (recipientEmail, recipientName, taskDetails) => {
    try {
        const senderName = process.env.EMAIL_SENDER_NAME;
        const senderEmail = process.env.EMAIL_SENDER_ADDRESS;
        const apiKey = process.env.BREVO_API_KEY_1;
        const apiUrl = process.env.BREVO_API_URL;

        if (!apiKey || !senderEmail) {
            console.error("Missing Email Configuration: API Key or Sender Email not found in .env");
            return;
        }

        const subject = `⚠️ High Priority Task Assigned: ${taskDetails.title}`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                    .header { background-color: #F44336; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { padding: 20px; }
                    .task-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #F44336; margin: 15px 0; }
                    .task-details p { margin: 8px 0; }
                    .footer { margin-top: 20px; font-size: 0.8em; text-align: center; color: #777; }
                    .priority-badge { display: inline-block; background-color: #F44336; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>⚠️ High Priority Task Assigned</h2>
                    </div>
                    <div class="content">
                        <p>Dear ${recipientName},</p>
                        <p>You have been assigned a <span class="priority-badge">HIGH PRIORITY</span> task that requires your immediate attention.</p>
                        
                        <div class="task-details">
                            <p><strong>Task Title:</strong> ${taskDetails.title}</p>
                            <p><strong>Description:</strong> ${taskDetails.description || 'N/A'}</p>
                            <p><strong>Priority:</strong> High</p>
                            <p><strong>Deadline:</strong> ${taskDetails.deadline ? new Date(taskDetails.deadline).toLocaleDateString() : 'Not specified'}</p>
                            ${taskDetails.milestone ? `<p><strong>Milestone:</strong> ${taskDetails.milestone}</p>` : ''}
                        </div>
                        
                        <p>Please log in to your portal to view full details and update the task status.</p>
                        <br>
                        <p>Best regards,</p>
                        <p><strong>WorkSync Project Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const payload = {
            sender: {
                name: senderName,
                email: senderEmail
            },
            to: [
                {
                    email: recipientEmail,
                    name: recipientName
                }
            ],
            subject: subject,
            htmlContent: htmlContent
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey,
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log(`High priority task email sent successfully to ${recipientEmail}`);
        } else {
            const errorData = await response.json();
            console.error("Failed to send high priority task email:", errorData);
        }

    } catch (error) {
        console.error("Error sending high priority task email:", error);
    }
};