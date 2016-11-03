const LogLevels = require('../src/logger').LogLevels
const logger = require('../src/logger').createLogger(LogLevels.INFO)

logger.error("This is an ERROR message %d %d %d", 2,3,4)
logger.warn("This is an WARN message %d %d %d", 2,3,4)
logger.info("This is an INFO message %d %d %d", 2,3,4)
logger.debug("This is an DEBUG message %d %d %d", 2,3,4)