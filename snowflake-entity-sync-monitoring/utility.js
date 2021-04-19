module.exports = {
    executeCommand: async function (context, connection, sqlText) {
        return new Promise((resolve, reject) => {
            connection.execute({
                sqlText,
                complete: function (err, stmt, rows) {
                    if (err) {
                        context.log(`Execution error while executing ${stmt} \n - ${err.message}`);
                        reject(err);
                    } else {
                        resolve(rows)
                    }
                }
            })
        })
    }
}