/**
 * Simple logger utility for the task management application.
 * Provides structured logging with levels and timestamps.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

let currentLevel = LOG_LEVELS.INFO;

function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLevel = LOG_LEVELS[level];
  }
}

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] ${message}`;
  if (meta) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

function debug(message, meta) {
  if (currentLevel <= LOG_LEVELS.DEBUG) {
    console.debug(formatMessage('DEBUG', message, meta));
  }
}

function info(message, meta) {
  if (currentLevel <= LOG_LEVELS.INFO) {
    console.info(formatMessage('INFO', message, meta));
  }
}

function warn(message, meta) {
  if (currentLevel <= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', message, meta));
  }
}

function error(message, meta) {
  if (currentLevel <= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', message, meta));
  }
}

module.exports = { debug, info, warn, error, setLogLevel, LOG_LEVELS };
