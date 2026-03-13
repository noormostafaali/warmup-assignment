const fs = require("fs");




//helper methods instead or writting them every function


// Helper 1: Parse time string like "6:01:20 am" to 24-hour format object
function parseTimeString(timeStr) {
    if (typeof timeStr !== 'string') return null;

    let parts = timeStr.trim().toLowerCase().split(' ');
    if (parts.length !== 2) return null;

    let timeParts = parts[0].split(':');
    if (timeParts.length !== 3) return null;

    let hours = parseInt(timeParts[0]);
    let minutes = parseInt(timeParts[1]);
    let seconds = parseInt(timeParts[2]);
    let period = parts[1];

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    if (hours < 1 || hours > 12) return null;
    if (minutes < 0 || minutes > 59) return null;
    if (seconds < 0 || seconds > 59) return null;
    if (period !== 'am' && period !== 'pm') return null;

    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return { hours, minutes, seconds };
}

// Helper 3: Convert time string "hh:mm:ss" to total seconds
function timeToSeconds(timeStr) {
    if (typeof timeStr !== 'string') return null;

    let parts = timeStr.trim().split(':');
    if (parts.length !== 3) return null;

    let hours = parseInt(parts[0]);
    let minutes = parseInt(parts[1]);
    let seconds = parseInt(parts[2]);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
    if (minutes < 0 || minutes > 59) return null;
    if (seconds < 0 || seconds > 59) return null;

    return (hours * 3600) + (minutes * 60) + seconds;
}

// Helper 2: Format seconds to "h:mm:ss" (hours without leading zero)
function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    if (seconds === null) return "0:00:00";

    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;

    let hoursStr = hours.toString(); // NO leading zero
    let minutesStr = minutes.toString().padStart(2, '0');
    let secondsStr = secs.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

// Helper 5: Get required quota in seconds for a given date  //didnt end up using cus i could read func 4 code easier without it 
function getDailyQuotaSeconds(date) {
    if (!date) return (8 * 3600) + (24 * 60); // Default to normal

    let dateParts = date.split('-');
    if (dateParts.length !== 3) return (8 * 3600) + (24 * 60);

    let year = parseInt(dateParts[0]);
    let month = parseInt(dateParts[1]);
    let day = parseInt(dateParts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return (8 * 3600) + (24 * 60);
    }

    // Eid period: April 10-30, 2025
    if (year === 2025 && month === 4 && day >= 10 && day <= 30) {
        return 6 * 3600; // 6 hours
    } else {
        return (8 * 3600) + (24 * 60); // 8 hours 24 minutes
    }
}
// Helper 4: Get day index from day name
function getDayIndex(dayName) {
    if (!dayName) return -1;

    let days = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
    };

    return days[dayName.toLowerCase()] ?? -1;
}
// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss

// FUNCTION 1: Calculate shift duration

function getShiftDuration(startTime, endTime) {
    let start = parseTimeString(startTime);
    let end = parseTimeString(endTime);

    if (!start || !end) return "0:00:00";

    let startSeconds = (start.hours * 3600) + (start.minutes * 60) + start.seconds;
    let endSeconds = (end.hours * 3600) + (end.minutes * 60) + end.seconds;

    if (endSeconds < startSeconds) {
        endSeconds += 24 * 3600;
    }

    let diffSeconds = endSeconds - startSeconds;

    return formatTime(diffSeconds);
}


// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
// FUNCTION 2: Calculate idle time (time outside delivery hours 8am-10pm)

function getIdleTime(startTime, endTime) {
    let start = parseTimeString(startTime);
    let end = parseTimeString(endTime);

    if (!start || !end) return "0:00:00";

    let startSeconds = (start.hours * 3600) + (start.minutes * 60) + start.seconds;
    let endSeconds = (end.hours * 3600) + (end.minutes * 60) + end.seconds;

    if (endSeconds < startSeconds) {
        endSeconds += 24 * 3600;
    }

    let deliveryStart = 8 * 3600;
    let deliveryEnd = 22 * 3600;

    let idleSeconds = 0;

    if (endSeconds <= deliveryStart) {
        idleSeconds = endSeconds - startSeconds;
    }
    else if (startSeconds >= deliveryEnd) {
        idleSeconds = endSeconds - startSeconds;
    }
    else {
        if (startSeconds < deliveryStart) {
            idleSeconds += deliveryStart - startSeconds;
        }
        if (endSeconds > deliveryEnd) {
            idleSeconds += endSeconds - deliveryEnd;
        }
    }

    return formatTime(idleSeconds);

}
//Edge cases handled:
// Shift entirely before 8am → all time is idle
//
// Shift entirely after 10pm → all time is idle
//
// Shift exactly at boundaries → handle 8am and 10pm correctly
//
// Overnight shifts → handle crossing midnight
//
// Invalid inputs → return "00:00:00"

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss

// FUNCTION 3: Calculate active time (shiftDuration - idleTime)
function getActiveTime(shiftDuration, idleTime) {
    let shiftSeconds = timeToSeconds(shiftDuration);
    let idleSeconds = timeToSeconds(idleTime);

    if (shiftSeconds === null || idleSeconds === null) {
        return "00:00:00";
    }

    if (idleSeconds > shiftSeconds) {
        return "00:00:00";
    }

    let activeSeconds = shiftSeconds - idleSeconds;

    // Active time should NOT have leading zeros for hours (from PDF: "3:30:10", "8:42:59")
    return formatTime(activeSeconds);
}
// ======================================================
// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
    // EDGE CASE 1: Invalid inputs
    if (typeof date !== 'string' || !activeTime) {
        return false;
    }

    // Parse date
    let dateParts = date.split('-');
    if (dateParts.length !== 3) return false;

    let year = parseInt(dateParts[0]);
    let month = parseInt(dateParts[1]);
    let day = parseInt(dateParts[2]);

    // EDGE CASE 2: Invalid date numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    // USE THE GLOBAL timeToSeconds HELPER!
    let activeSeconds = timeToSeconds(activeTime);
    if (activeSeconds === null) return false;

    // Determine quota based on date
    let quotaSeconds;

    // EDGE CASE 3: Eid period (April 10-30, 2025)
    if (year === 2025 && month === 4 && day >= 10 && day <= 30) {
        quotaSeconds = 6 * 3600; // 6 hours in seconds
    } else {
        // Normal day: 8 hours and 24 minutes
        quotaSeconds = (8 * 3600) + (24 * 60); // 8h 24m in seconds
    }

    // EDGE CASE 4: Compare active time with quota
    return activeSeconds >= quotaSeconds;
    //If active time is GREATER THAN OR EQUAL to quota → true
    // If active time is LESS than quota → false

}


// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
// FUNCTION 5: Add a new shift record to the file
function addShiftRecord(textFile, shiftObj) {
    // EDGE CASE 1: Invalid inputs
    if (!textFile || !shiftObj || typeof shiftObj !== 'object') {
        return {}; // Return empty object
    }

    // EDGE CASE 2: Missing required properties
    let requiredProps = ['driverID', 'driverName', 'date', 'startTime', 'endTime'];
    for (let prop of requiredProps) {
        if (!shiftObj[prop]) {
            return {}; // Return empty object
        }
    }

    try {
        // USING fs.readFileSync() to read the file
        let fileContent;
        try {
            fileContent = fs.readFileSync(textFile, 'utf8');
        } catch (err) {
            // EDGE CASE 3: File doesn't exist or can't be read
            return {}; // Return empty object
        }

        // Split into lines and remove empty lines
        let lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // EDGE CASE 4: Check for duplicate (same driverID and date)
        for (let line of lines) {
            let columns = line.split(',');
            if (columns.length >= 3) {
                let existingDriverID = columns[0].trim();
                let existingDate = columns[2].trim();

                if (existingDriverID === shiftObj.driverID && existingDate === shiftObj.date) {
                    return {}; // Duplicate found - return empty object
                }
            }
        }

        // Calculate all the values using our existing functions
        let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
        let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
        let activeTime = getActiveTime(shiftDuration, idleTime);
        let metQuotaValue = metQuota(shiftObj.date, activeTime);

        // Create the new record object with ALL 10 properties
        let newRecord = {
            driverID: shiftObj.driverID,        // 1. driverID
            driverName: shiftObj.driverName,    // 2. driverName
            date: shiftObj.date,                 // 3. date
            startTime: shiftObj.startTime,       // 4. startTime
            endTime: shiftObj.endTime,           // 5. endTime
            shiftDuration: shiftDuration,        // 6. shiftDuration (calculated)
            idleTime: idleTime,                   // 7. idleTime (calculated)
            activeTime: activeTime,               // 8. activeTime (calculated)
            metQuota: metQuotaValue,              // 9. metQuota (calculated)
            hasBonus: false                        // 10. hasBonus (default false)
        };

        // Create the CSV line for the new record
        let newLine = `${newRecord.driverID},${newRecord.driverName},${newRecord.date},${newRecord.startTime},${newRecord.endTime},${newRecord.shiftDuration},${newRecord.idleTime},${newRecord.activeTime},${newRecord.metQuota},${newRecord.hasBonus}`;

        // Find where to insert the new record
        let insertIndex = lines.length; // Default to end of file

        if (shiftObj.driverID) {
            // Look for the LAST occurrence of this driverID
            for (let i = lines.length - 1; i >= 0; i--) {
                let columns = lines[i].split(',');
                if (columns.length >= 1 && columns[0].trim() === shiftObj.driverID) {
                    insertIndex = i + 1; // Insert AFTER this line
                    break;
                }
            }
        }

        // Insert the new line at the correct position
        lines.splice(insertIndex, 0, newLine);

        // USING fs.writeFileSync() to write back to the file
        fs.writeFileSync(textFile, lines.join('\n') + '\n');

        // SUCCESS: Return object with ALL 10 properties
        return newRecord;

    } catch (error) {
        // EDGE CASE 5: Any unexpected error
        return {}; // Return empty object
    }
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
    // EDGE CASE 1: Invalid inputs
    if (!textFile || !driverID || !date || newValue === undefined) {
        return; // Return nothing
    }

    // EDGE CASE 2: newValue should be boolean
    if (typeof newValue !== 'boolean') {
        return;
    }

    try {
        // Read the file
        let fileContent;
        try {
            fileContent = fs.readFileSync(textFile, 'utf8');
        } catch (err) {
            return; // File doesn't exist or can't be read
        }

        // Split into lines
        let lines = fileContent.split('\n');
        let found = false;

        // EDGE CASE 3: Process each line
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line === '') continue; // Skip empty lines

            let columns = line.split(',');

            // EDGE CASE 4: Check if line has enough columns
            if (columns.length >= 10) {
                let existingID = columns[0].trim();
                let existingDate = columns[2].trim();

                // EDGE CASE 5: Match found!
                // Finding the right record:
                if (existingID === driverID && existingDate === date) {
                    // Update the hasBonus column (last column, index 9)
                    columns[9] = newValue.toString();
                    lines[i] = columns.join(',');
                    found = true;
                    break; // Stop after finding and updating
                }
            }
        }

        // EDGE CASE 6: Only write to file if we found and updated something
        if (found) {
            fs.writeFileSync(textFile, lines.join('\n'));
        }

        // Function returns nothing (void)
        return;

    } catch (error) {
        // EDGE CASE 7: Any unexpected error - just return silently
        return;
    }
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================

// FUNCTION 7: Count how many bonuses a driver got in a given month
function countBonusPerMonth(textFile, driverID, month) {
    // EDGE CASE 1: Invalid inputs
    if (!textFile || !driverID || month === undefined) {
        return -1;
    }

    try {
        // Read the file
        let fileContent;
        try {
            fileContent = fs.readFileSync(textFile, 'utf8');
        } catch (err) {
            return -1; // File doesn't exist or can't be read
        }

        // Split into lines and remove empty lines
        let lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // EDGE CASE 2: Format month to 2 digits (e.g., "4" -> "04", "04" -> "04")
        let monthStr = month.toString().padStart(2, '0');

        let driverExists = false;
        let bonusCount = 0;

        // EDGE CASE 3: Process each line
        for (let line of lines) {
            let columns = line.split(',');

            // Check if line has enough columns
            if (columns.length >= 10) {
                let currentID = columns[0].trim();
                let currentDate = columns[2].trim();
                let currentBonus = columns[9].trim();

                // Check if this is our driver
                if (currentID === driverID) {
                    driverExists = true;

                    // Extract month from date (date format: yyyy-mm-dd)
                    let dateParts = currentDate.split('-');
                    if (dateParts.length >= 2) {
                        let recordMonth = dateParts[1]; // Month is at index 1

                        // EDGE CASE 4: Compare months (both as 2-digit strings)
                        if (recordMonth === monthStr) {
                            // EDGE CASE 5: Check if bonus is true (could be "true" or true)
                            if (currentBonus === 'true' || currentBonus === true) {
                                bonusCount++;
                            }
                        }
                    }
                }
            }
        }

        // EDGE CASE 6: If driver never found, return -1
        if (!driverExists) {
            return -1;
        }

        return bonusCount;

    } catch (error) {
        // EDGE CASE 7: Any unexpected error
        return -1;
    }
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
// FUNCTION 8: Calculate total active hours for a driver in a given month
function getTotalActiveHoursPerMonth(textFile, driverID, month) {

        if (!textFile || !driverID || month === undefined) {
            return "0:00:00";
        }

        try {
            let fileContent;
            try {
                fileContent = fs.readFileSync(textFile, 'utf8');
            } catch (err) {
                return "0:00:00";
            }

            let lines = fileContent.split('\n').filter(line => line.trim() !== '');
            let monthStr = month.toString().padStart(2, '0');

            let totalSeconds = 0;
            let driverFound = false;

            for (let line of lines) {
                let columns = line.split(',');
                if (columns.length >= 8) {
                    let currentID = columns[0].trim();
                    let currentDate = columns[2].trim();
                    let activeTime = columns[7].trim();

                    if (currentID === driverID) {
                        driverFound = true;

                        let dateParts = currentDate.split('-');
                        if (dateParts.length >= 2) {
                            let recordMonth = dateParts[1];
                            if (recordMonth === monthStr) {
                                let seconds = timeToSeconds(activeTime);
                                if (seconds !== null) {
                                    totalSeconds += seconds;
                                }
                            }
                        }
                    }
                }
            }

            if (!driverFound) {
                return "0:00:00";
            }

            return formatTime(totalSeconds);

        } catch (error) {
            return "0:00:00";
        }
    }


// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
// FUNCTION 9: Calculate total required hours for a driver in a given month

// FUNCTION 9: Calculate total required hours for a driver in a given month
// FUNCTION 9: Calculate total required hours for a driver in a given month
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    if (!textFile || !rateFile || bonusCount === undefined || !driverID || month === undefined) {
        return "0:00:00";
    }

    if (typeof bonusCount !== 'number' || bonusCount < 0) {
        bonusCount = 0;
    }

    try {
        // Read rates file
        let rateContent;
        try {
            rateContent = fs.readFileSync(rateFile, 'utf8');
        } catch (err) {
            return "0:00:00";
        }

        let rateLines = rateContent.split('\n').filter(line => line.trim() !== '');
        let dayOff = null;
        let driverFound = false;

        for (let line of rateLines) {
            let columns = line.split(',');
            if (columns.length >= 2) {
                if (columns[0].trim() === driverID) {
                    driverFound = true;
                    dayOff = columns[1].trim();
                    break;
                }
            }
        }

        if (!driverFound) return "0:00:00";

        // Read shifts file
        let shiftContent;
        try {
            shiftContent = fs.readFileSync(textFile, 'utf8');
        } catch (err) {
            return "0:00:00";
        }

        let shiftLines = shiftContent.split('\n').filter(line => line.trim() !== '');
        let monthStr = month.toString().padStart(2, '0');

        let workedDates = new Set();

        for (let line of shiftLines) {
            let columns = line.split(',');
            if (columns.length >= 3) {
                if (columns[0].trim() === driverID) {
                    let currentDate = columns[2].trim();
                    let dateParts = currentDate.split('-');
                    if (dateParts.length >= 2 && dateParts[1] === monthStr) {
                        workedDates.add(currentDate);
                    }
                }
            }
        }

        // Calculate required hours
        let totalRequiredSeconds = 0;
        let dayOffIndex = getDayIndex(dayOff);

        for (let date of workedDates) {
            let dateObj = new Date(date);
            let dayOfWeek = dateObj.getDay();

            if (dayOfWeek === dayOffIndex) continue;

            let dateParts = date.split('-');
            let year = parseInt(dateParts[0]);
            let monthNum = parseInt(dateParts[1]);
            let day = parseInt(dateParts[2]);

            let isEid = (year === 2025 && monthNum === 4 && day >= 10 && day <= 30);

            if (isEid) {
                totalRequiredSeconds += 6 * 3600;
            } else {
                totalRequiredSeconds += (8 * 3600) + (24 * 60);
            }
        }

        // Apply bonus reduction
        let bonusReductionSeconds = bonusCount * 2 * 3600;
        totalRequiredSeconds = Math.max(0, totalRequiredSeconds - bonusReductionSeconds);

        return formatTime(totalRequiredSeconds);

    } catch (error) {
        return "0:00:00";
    }
}
// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
    // FUNCTION 10: Calculate net pay after deductions
 // EDGE CASE 1: Invalid inputs
        if (!driverID || !actualHours || !requiredHours || !rateFile) {
            return 0;
        }

        try {
            // STEP 1: Read driverRates.txt to find driver's tier and base pay
            let rateContent;
            try {
                rateContent = fs.readFileSync(rateFile, 'utf8');
            } catch (err) {
                return 0;
            }

            let rateLines = rateContent.split('\n').filter(line => line.trim() !== '');
            let basePay = 0;
            let tier = 0;
            let driverFound = false;

            for (let line of rateLines) {
                let columns = line.split(',');
                if (columns.length >= 4) {
                    let currentID = columns[0].trim();
                    if (currentID === driverID) {
                        driverFound = true;
                        basePay = parseInt(columns[2].trim()); // basePay at index 2
                        tier = parseInt(columns[3].trim());    // tier at index 3
                        break;
                    }
                }
            }

            // EDGE CASE 2: Driver not found in rates file
            if (!driverFound) {
                return 0;
            }

            // EDGE CASE 3: Invalid tier (should be 1-4)
            if (tier < 1 || tier > 4) {
                return basePay;
            }

            // STEP 2: Convert actual and required hours to seconds using global helper
            let actualSeconds = timeToSeconds(actualHours);
            let requiredSeconds = timeToSeconds(requiredHours);

            // EDGE CASE 4: Invalid time formats
            if (actualSeconds === null || requiredSeconds === null) {
                return basePay;
            }

            // STEP 3: If actual >= required, full pay!
            if (actualSeconds >= requiredSeconds) {
                return basePay;
            }

            // STEP 4: Calculate missing hours
            let missingSeconds = requiredSeconds - actualSeconds;
            let missingHours = Math.floor(missingSeconds / 3600); // Only full hours count!

            // STEP 5: Get allowed missing hours based on tier
            let allowedMissing = {
                1: 50,  // Senior
                2: 20,  // Regular
                3: 10,  // Junior
                4: 3    // Trainee
            };

            let allowance = allowedMissing[tier] || 0;

            // STEP 6: Calculate billable missing hours (after allowance)
            let billableMissingHours = Math.max(0, missingHours - allowance);

            // EDGE CASE 5: If no billable hours, full pay
            if (billableMissingHours === 0) {
                return basePay;
            }

            // STEP 7: Calculate deduction rate (floor(basePay / 185))
            let deductionRatePerHour = Math.floor(basePay / 185);

            // EDGE CASE 6: If deduction rate is 0, no deduction
            if (deductionRatePerHour === 0) {
                return basePay;
            }

            // STEP 8: Calculate deduction and net pay
            let salaryDeduction = billableMissingHours * deductionRatePerHour;
            let netPay = basePay - salaryDeduction;

            // EDGE CASE 7: Net pay shouldn't go below 0
            return Math.max(0, netPay);

        } catch (error) {
            return 0;
        }
    }


module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
