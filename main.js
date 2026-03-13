const fs = require("fs");



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
// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================

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
// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
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
// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
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
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
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
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
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
