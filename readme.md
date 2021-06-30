# Identifo Web Element
Simple drop in auth web component for Identifo.

## Usage
You need to set `app-id` and `url` props.

```<identifo-form app-id="ххх" url="https://identifo.com" theme="light"></identifo-form>```

## Properties

| Property | Attribute | Description | Type                | Default     |
| -------- | --------- | ----------- | ------------------- | ----------- |
| `appId`  | `app-id`  |             | `string`            | `undefined` |
| `theme`  | `theme`   |             | `"dark" \| "light"` | `undefined` |
| `url`    | `url`     |             | `string`            | `undefined` |


## Events

| Event           | Description | Type                    |
| --------------- | ----------- | ----------------------- |
| `error`         |             | `CustomEvent<ApiError>` |
| `loginComplete` |             | `CustomEvent<string>`   |


----------------------------------------------