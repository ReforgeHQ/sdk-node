# Logger Integrations

Reforge provides integrations with popular Node.js logging frameworks to enable dynamic log level control.

## Features

- **Dynamic Log Levels**: Change log levels in real-time without restarting your application
- **Optional Dependencies**: Logger integrations are optional peer dependencies
- **Flexible Version Support**: Compatible with pino >=7.0.0 and winston >=3.0.0

## Installation

Install Reforge along with your preferred logging framework:

```bash
# With Pino
npm install @reforge-com/node pino

# With Winston
npm install @reforge-com/node winston
```

## Pino Integration

### Basic Usage

```typescript
import { Reforge } from '@reforge-com/node';
import { createPinoLogger } from '@reforge-com/node/integrations/pino';

const reforge = new Reforge({
  sdkKey: process.env.REFORGE_SDK_KEY,
  loggerKey: 'my.log.config', // Config key for LOG_LEVEL_V2 (defaults to 'log-levels.default')
});

await reforge.init();

// Create a logger that dynamically gets its level from Reforge
const logger = await createPinoLogger(reforge, 'my.app.component', {
  // Optional: any pino options
  transport: { target: 'pino-pretty' }
});

if (logger) {
  logger.info('Application started');
  logger.debug('Debug information'); // Only logs if level permits
}
```

### Using with Existing Pino Logger

If you already have a Pino logger, you can use the `createPinoHook` to add Reforge log level information:

```typescript
import pino from 'pino';
import { createPinoHook } from '@reforge-com/node/integrations/pino';

const logger = pino({
  mixin: createPinoHook(reforge, 'my.app.component')
});

// Log entries will include reforgeLogLevel field
logger.info('test'); // { reforgeLogLevel: 'info', msg: 'test', ... }
```

## Winston Integration

### Basic Usage

```typescript
import { Reforge } from '@reforge-com/node';
import { createWinstonLogger } from '@reforge-com/node/integrations/winston';

const reforge = new Reforge({
  sdkKey: process.env.REFORGE_SDK_KEY,
  loggerKey: 'my.log.config',
});

await reforge.init();

// Create a logger that dynamically gets its level from Reforge
const logger = await createWinstonLogger(reforge, 'my.app.component', {
  // Optional: any winston options
  transports: [new winston.transports.Console()]
});

if (logger) {
  logger.info('Application started');
  logger.debug('Debug information'); // Only logs if level permits
}
```

### Using with Existing Winston Logger

```typescript
import winston from 'winston';
import { createWinstonFormat } from '@reforge-com/node/integrations/winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    await createWinstonFormat(reforge, 'my.app.component'),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Log entries will include reforgeLogLevel field
logger.info('test'); // { reforgeLogLevel: 'info', message: 'test', ... }
```

## Configuring Log Levels in Reforge

### Create a LOG_LEVEL_V2 Config

1. In the Reforge UI, create a new config with type `LOG_LEVEL_V2`
2. Set your logger key (e.g., `my.log.config`)
3. Add rules based on the `reforge-sdk-logging.logger-path` context property

### Example Rules

```typescript
// Rule 1: DEBUG for specific component
{
  criteria: [
    {
      propertyName: "reforge-sdk-logging.logger-path",
      operator: "PROP_IS_ONE_OF",
      valueToMatch: { stringList: { values: ["my.app.auth"] } }
    }
  ],
  value: { logLevel: "DEBUG" }
}

// Rule 2: INFO as default
{
  criteria: [],
  value: { logLevel: "INFO" }
}
```

### Using getLogLevel() Directly

You can also use `getLogLevel()` directly with any logging framework:

```typescript
import { Reforge, LogLevel } from '@reforge-com/node';

const reforge = new Reforge({
  sdkKey: process.env.REFORGE_SDK_KEY,
  loggerKey: 'my.log.config',
});

await reforge.init();

// Get the log level for a specific logger
const level = reforge.getLogLevel('my.app.component');

// Map to your logger's level system
if (level === LogLevel.Debug) {
  myLogger.level = 'debug';
} else if (level === LogLevel.Info) {
  myLogger.level = 'info';
}
// ... etc
```

## Log Level Mapping

### Reforge → Pino
- `TRACE` → `trace`
- `DEBUG` → `debug`
- `INFO` → `info`
- `WARN` → `warn`
- `ERROR` → `error`
- `FATAL` → `fatal`

### Reforge → Winston
- `TRACE` → `debug` (Winston doesn't have trace)
- `DEBUG` → `debug`
- `INFO` → `info`
- `WARN` → `warn`
- `ERROR` → `error`
- `FATAL` → `error` (Winston doesn't have fatal)

## Important Notes

1. **No Hierarchy Traversal**: Unlike the previous LOG_LEVEL implementation, LOG_LEVEL_V2 does NOT traverse logger name hierarchies. Each logger name is evaluated independently.

2. **Default Value**:
   - The default `loggerKey` is `"log-levels.default"`
   - If no config is found with that key, `getLogLevel()` returns `DEBUG`

3. **Dynamic Updates**: Log levels update automatically when your Reforge config changes (via SSE or polling).

4. **Context Evaluation**: The integrations pass the logger name in the context as:
   ```typescript
   {
     "reforge-sdk-logging": {
       "lang": "javascript",
       "logger-path": loggerName
     }
   }
   ```

## Graceful Degradation

If pino or winston is not installed, the integration functions will return `undefined` and log a warning to the console. Your application will continue to work, but dynamic log levels won't be available.

```typescript
const logger = await createPinoLogger(reforge, 'my.app');
if (!logger) {
  console.warn('Pino not available, falling back to console');
  // Use console or another fallback
}
```
