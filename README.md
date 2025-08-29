# datadog-RUM-APM-e2e-example

A simple docker-compose setup to allow you to see how RUM and APM connect together in a full
connected setup.

### Pre-requisites

- docker-compose
- A Datadog API Key

#### Step 1: Setup a RUM Application in Datadog

Go to your Datadog account, navigate to your RUM Applications, and create a
[New Application](https://app.datadoghq.com/rum/create).

Give it the name "datablog" and then click "Generate Client Token".

This will provide you an `applicationId` and `clientToken`, you will utilize these to enable RUM for
your application.

### Deploy with docker-compose

#### Step 1: Update .env with your correct keys

Copy the existing .env.example file

```
$ cp .env.example .env
```

Add in your RUM Client Token and Application ID, as well as your Datadog API key and change the site
if you're not using Datadog.com (eg. `datadoghq.eu`)

#### Step 2: Build the app image

Run the following while in this directory:

```
docker-compose build
```

This will build the image for the application.

#### Step 3: Bring up the Containers

```
docker-compose up -d
```

Then visit http://localhost:3000 in your browser, and create some traffic.

## Features

### Custom Instrumentation for APM

There are a few examples of Custom Instrumentation generating custom spans within this application.
There are a couple ways documented in our [API Docs](https://datadoghq.dev/dd-trace-js/) and
[Public Docs](https://docs.datadoghq.com/tracing/custom_instrumentation/nodejs/?tab=asyncawait#creating-spans).

You'll see examples using the async/await calls and the `tracer.wrap(...)` calls in
`/controllers/manage-pages.js`

### Connecting RUM and APM

For starters you can read about connecting RUM and APM Data here:

- https://docs.datadoghq.com/real_user_monitoring/connect_rum_and_traces/?tab=browserrum

The examples currently provided are limited towards the NPM Setup, but the idea there is the same
for the CDN setup here. We just need to add in the configuration option for `allowedTracingOrigins`.
In this case my `allowedTracingOrigins` is set like:

```
    allowedTracingOrigins: [/http:\/\/localhost:3000/],
```

To track any requests made locally to "my" API. You'll see that in the init script if you bring up
the Browser Developer Console and go to the Elements page holding the HTML / init script here.

This works by having the RUM package set headers like `x-datadog-trace-id` and `x-datadog-parent-id`
when making the request to the APM Service to initialize the trace. The APM Service receiving this
will then handle it like a Distributed Trace. I've included those headers into the logs for the API
Requests, which you can see in your Log Explorer.

An important note is that this supports Javascript Strings and Regex Strings. These are _separate_
entities in Javascript.

By default this will set the the `browser.request` spans as `datablog-ui` to separate them from the
"backend" `datablog` spans. You'll see them when creating, updating, or deleting a given page. It is
just limited to those as those are the only "requests" the Browser is making in this. You can see
those requests at the corresponding files:

- `new-page.ejs` for the create / POST request
- `edit-page.ejs` for the update / PUT request
- `page.ejs` for the delete / DELETE request

### Future Features

- User tracking via login
- MongoDB Integration
- DBM for MongoDB
- Custom Context
