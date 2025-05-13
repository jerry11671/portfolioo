const { AppError } = require("../middleware/error");

const wrappers = {
    asyncControllerWrapper (fn) {
        return async (req, res, next) => {
            try {
                await fn(req, res, next);
            } catch (error) {
                next(error);
            }
        }
    },

    asyncLibWrapper (libFn) {
        return async (params) => {
            try {
                return await libFn(params);
            } catch (error) {
               if (error instanceof AppError) throw error;
               else throw new AppError(500, "Internal server error.");
            }
        }
    }
}


module.exports = wrappers;