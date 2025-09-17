# @reforge-com/node

Reforge Node.js client

---

Install the client

`npm install @reforge-com/node` or `yarn add @reforge-com/node`

## Usage

Set up a Reforge Node.js client.

```js
import { Reforge } from "@reforge-com/node";

if (!process.env.REFORGE_API_KEY) {
  throw new Error("REFORGE_API_KEY is not set");
}

const reforge = new Reforge({
  apiKey: process.env.REFORGE_API_KEY,
  enableSSE: true,
  enablePolling: true,
});

await reforge.init();
```

After the init completes you can use

- `reforge.get('some.config.name')` returns a raw value
- `reforge.isFeatureEnabled('some.feature.name')` returns true or false
- `reforge.shouldLog({loggerName, desiredLevel, defaultLevel, contexts})` returns true or false

Reforge supports [context](https://docs.prefab.cloud/docs/explanations/concepts/context) for
intelligent rule-based evaluation of `get` and `isFeatureEnabled` based on the current
request/device/user/etc.

Given

```javascript
const context = new Map([
  [
    "user",
    new Map([
      ["key", "some-unique-identifier"],
      ["country", "US"],
    ]),
  ],

  [
    "subscription",
    new Map([
      ["key", "pro-sub"],
      ["plan", "pro"],
    ]),
  ],
]);
```

You can pass this in to each call

- `reforge.get('some.config.name', context, defaultValue)`
- `reforge.isFeatureEnabled('some.feature.name', context, false)`

Or you can set the context in a block (perhaps surrounding evaluation of a web request)

```js
reforge.inContext(context, (pf) => {
  const optionalJustInTimeContext = { ... }

  console.log(pf.get("some.config.name", optionalJustInTimeContext, defaultValue))
  console.log(pf.isEnabled("some.config.name", optionalJustInTimeContext, false))
})
```

Note that you can also provide Context as an object instead of a Map, e.g.:

```javascript
{
  user: {
    key: "some-unique-identifier",
    country: "US"
  },
  subscription: {
    key: "pro-sub",
    plan: "pro"
  }
}
```

#### Option Definitions

Besides `apiKey`, you can initialize `new Reforge(...)` with the following options

| Name                       | Description                                                                                                                            | Default           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| collectEvaluationSummaries | Send counts of config/flag evaluation results back to Reforge to view in web app                                                       | true              |
| collectLoggerCounts        | Send counts of logger usage back to Reforge to power log-levels configuration screen                                                   | true              |
| contextUploadMode          | Upload either context "shapes" (the names and data types your app uses in reforge contexts) or periodically send full example contexts | "periodicExample" |
| defaultLevel               | Level to be used as the min-verbosity for a `loggerPath` if no value is configured in Reforge                                          | "warn"            |
| enableSSE                  | Whether or not we should listen for live changes from Reforge                                                                          | true              |
| enablePolling              | Whether or not we should poll for changes from Reforge                                                                                 | false             |

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and
create. Any contributions you make are **greatly appreciated**. For detailed contributing
guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md)
