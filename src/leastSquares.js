export default function(valuesX, valuesY) {
    var sumX = 0;
    var sumY = 0;
    var sumXY = 0;
    var sumXX = 0;
    var count = 0;

    /*
     * We'll use those variables for faster read/write access.
     */
    var x = 0;
    var y = 0;
    var len = valuesX.length;

    if (len !== valuesY.length) {
        throw new Error('The parameters valuesX and valuesY need to have same size!');
    }

    /*
     * Nothing to do.
     */
    if (len === 0) {
        return [[], []];
    }

    /*
     * Calculate the sum for each of the parts necessary.
     */
    for (var v = 0; v < len; v++) {
        x = valuesX[v];
        y = valuesY[v];
        sumX += x;
        sumY += y;
        sumXX += x * x;
        sumXY += x * y;
        count++;
    }

    /*
     * Calculate m and b for the formular:
     * y = x * m + b
     */
    var m = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
    var b = sumY / count - (m * sumX) / count;

    return x => x * m + b;
}
