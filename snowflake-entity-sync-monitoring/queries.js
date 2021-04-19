function getMaxTimestampForEntities(tableNames) {
    let query = ``
    for(let i = 0; i < tableNames.length; i++){
        query += `\n SELECT MAX(_TS) AS MAX_UPDATED_TIMESTAMP FROM ${tableNames[i]}`;

        if (i != tableNames.length - 1) {
            query += "\n UNION"
        }
    }
    return query;
}

module.exports = {
    getMaxTimestampForEntities
}