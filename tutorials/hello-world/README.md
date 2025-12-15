# CC Hello World

Now that you have the [`cccli` up and running](./03_cc-cli.md) locally and a [local Docker compute environment](./02_setting-up-local-docker.md) configured we can run the hello world compute examples to familiarize yourself with running computes.

## Setup

The following steps assume that you have cloned this repository to your local machine and are working in the command line in the `tutorials/tutorials/hello-world` directory

We also assume that you've created an environment file at `.env-local`, meaning, if you haven't already, create a file inside the working directory called `.env-local`; populate it like this:

```
CC_AWS_ACCESS_KEY_ID=OBFLI6AWPWRmaFxOn4Zw
CC_AWS_SECRET_ACCESS_KEY=B5Mjn5FtekP6wwBGNecnVejgyG0c9jiaGAjshNui
CC_AWS_DEFAULT_REGION=us-east-1
CC_AWS_S3_BUCKET=ccstore
CC_AWS_ENDPOINT=http://localhost:9000
```

> Make sure to update your access keys to the ones created when configuring the local `ccstore` in minio.

## Hello World Plugin

We've developed a `hello-world-plugin` that simply prints any environment variables beginning with `CC_` to illustrate how CC uses compute manifests to orchestrate event runs and how it modifies the environment based on the compute configuration. You can see the plugin manifest in `tutorials/tutorials/hello-world/hello-world-plugin.json`:

```json
{
  "name": "HELLO-WORLD-PLUGIN",
  "image_and_tag": "ghcr.io/usace-cloud-compute/hello-world-plugin:latest",
  "description": "Cloud Compute Hello World",
  "compute_environment": {
    "vcpu": "1",
    "memory": "256"
  }
}
```

A plugin manifest points CC to the image it should pull and use for the run as well as any compute environment settings to use.

## Basic Compute

The simplest type of compute uses a built in list event generator to create a single event instance and run it. Let's look at the `hello-world/compute.json` compute manifest and see what it's doing:

```json
{
  "name": "CC Hello World",
  "provider": {
    "type": "docker",
    "concurrency": 1,
    "queue": "docker-local"
  },
  "plugins": ["hello-world-plugin.json"],
  "event": {
    "compute-manifests": [
      "hello-world-manifest1.json",
      "hello-world-manifest2.json"
    ]
  }
}
```

Assuming you've set up an environment variable file at `.env-local` you can run the above compute using the command:

```sh
cccli --envFile=.env-local --computeFile=compute.json run
```

This should result in a set of logs that look something like this:

```sh
Using the docker compute provider
{"name":"","resourceName":"","revision":0}
2025/12/09 13:40:12 Starting Runner
Compute Identifier: 32669551-5a59-4485-b43d-c6bf197d9584
2025/12/09 13:40:12 SUBMITTED JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0
2025/12/09 13:40:12 SUBMITTED JOB: b660114e-11f9-4926-bb0f-c86ac31868d3
2025/12/09 13:40:12 RUNNING JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0
STARTING MONITOR FOR: 5288cfc4f75499bd8dfb62ff38969cb100c3773949bda337cbd2d16143f2d9a1
JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0: 2025-12-09T19:40:13.072889338Z CC_PAYLOAD_ID=6c5fad2d-e81f-4514-bb90-967451ffc830
JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0: 2025-12-09T19:40:13.072910755Z CC_MANIFEST_ID=f09d7bd6-5987-4829-a9cf-ee3841868893
JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0: 2025-12-09T19:40:13.072912671Z CC_EVENT_IDENTIFIER=1
JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0: 2025-12-09T19:40:13.072913546Z CC_EVENT_NUMBER=1
JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0: 2025-12-09T19:40:13.072914338Z CC_PLUGIN_DEFINITION=HELLO-WORLD-PLUGIN
2025/12/09 13:40:13 FINISHED JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0
2025/12/09 13:40:13 PENDING JOB: b660114e-11f9-4926-bb0f-c86ac31868d3 CAN START
2025/12/09 13:40:13 RUNNING JOB: b660114e-11f9-4926-bb0f-c86ac31868d3
STARTING MONITOR FOR: b1c33271e0ec909d01ff8e4a60dc5847d2321ef7a037d3a8dbbd49ceda7b47d6
JOB: b660114e-11f9-4926-bb0f-c86ac31868d3: 2025-12-09T19:40:13.287779380Z CC_PAYLOAD_ID=00000000-0000-0000-0000-000000000000
JOB: b660114e-11f9-4926-bb0f-c86ac31868d3: 2025-12-09T19:40:13.287801838Z CC_MANIFEST_ID=7185c63e-31f4-40e2-ba80-f284b7220d8f
JOB: b660114e-11f9-4926-bb0f-c86ac31868d3: 2025-12-09T19:40:13.287803838Z CC_EVENT_IDENTIFIER=1
JOB: b660114e-11f9-4926-bb0f-c86ac31868d3: 2025-12-09T19:40:13.287804796Z CC_EVENT_NUMBER=1
JOB: b660114e-11f9-4926-bb0f-c86ac31868d3: 2025-12-09T19:40:13.287805588Z CC_PLUGIN_DEFINITION=HELLO-WORLD-PLUGIN
2025/12/09 13:40:13 FINISHED JOB: b660114e-11f9-4926-bb0f-c86ac31868d3
2025/12/09 13:40:13 JOB: 06f09d86-d448-4b40-82fe-215dd933c2f0: Shutting down container monitor. Container is no longer running.
2025/12/09 13:40:13 JOB: b660114e-11f9-4926-bb0f-c86ac31868d3: Shutting down container monitor. Container is no longer running.
Shutting Down
```

Thinking back to our event definition in the compute manifest, we're running one event which is comprised of two plugins, one having a dependency on the other.

The first block of log lines starting with `JOB:` are the output from running the plugin specified in `hello-world-manifest1.json` and you can tell that job has to finish before the second job can start and print it's environment.

Notice that the first job has a `CC_PAYLOAD_ID` showing a real GUID while the second is an empty GUID. This tells us that we wrote a payload to the CC store for the first run, but not the second. If we look at the `hello-world-manifest1.json` file, we'll find that we've added an `inputs` block:

```json
"inputs": {
    "payload_attributes": {
        "test": "hello world"
    }
}
```

By adding this attribute, CC knows to write a payload that is available to the plugin at runtime. Accessing the payload is a function of the plugin itself, using one of the CC Software Development Kits makes this trivial, in this particular case our plugin doesn't actually use the payload. However, you can go to minio and see what it looks like.

Navigate to your minio instance at `http://localhost:9001` and log in using the credentials used in the docker-compose file.

Click into the `ccstore/cc_store` bucket/prefix and you should see a folder matching the GUID from your logs for the first run. If you download and view it you will see that the attributes have been added to the payload:

```json
{
  "attributes": { "test": "hello world" },
  "stores": null,
  "inputs": null,
  "outputs": null,
  "actions": null
}
```

## Using Event Generators

Let's make this a little more complicated. As we've covered before, event generators are a utility for taking one event or DAG and running many iterations of the event with options for providing additional information for each run so that you can do things like do stochastic modelling or other repetitive compute tasks.

### Array Event Generator

If we take a look at `hello-world/compute-array.json`, we can see it's the same content as `compute.json` but with an additional key describing our array event generator.

```json
"generator": {
    "type": "array",
    "start": 1,
    "end": 3
}
```

Run the example below:

```sh
cccli --envFile=.env-local --computeFile=compute-array.json run
```

If you look through the logs, you should be able to discern a total of 6 jobs being run. Our event generator is running 3 events, you can see `CC_EVENT_IDENTIFIER`s 1 through 3, and you should see each of those twice, once for the first plugin run and once for the second that are part of the event DAG.

### Stream Event Generator

Let's say we need more than just a start and end event number, we need the ability to pass in `CC_EVENT_IDENTIFIER`s that are names of something, or a discrete set of numeric event IDs. That's where the stream event generator comes in.

If we look at the generator block from the `hello-world/compute-stream.json` file, we'll see that the stream event generator reads event ID's from a file, in this case a `.csv` file, but you can use any delimiter that you like.

```json
"generator": {
    "type": "stream",
    "file": "hello-world.csv",
    "delimiter": ","
}
```

Opening up `hello-world.csv` we see it contains two words separated by a comma:

```csv
hello,world
```

In this example we'll run two events, or two passes through the event DAG one with a `CC_EVENT_IDENTIFIER` of "hello" and one with "world".

```sh
cccli --envFile=.env-local --computeFile=compute-stream.json run
```

Let's say we have a list of event IDs that map to some significant information, perhaps from a previous model run. Our second stream event generator example points to the `important-events.csv` file:

```csv
1,4,45,7763,32322
```

Again these are comma delimited, but they wouldn't have to be.

Running the `cccli` with the `hello-world/compute-stream2.json` compute manifest shows us what that looks like.

```sh
cccli --envFile=.env-local --computeFile=compute-stream2.json run
```

### Add a Per-Event Loop

We can add an additional inner loop over sets of variables by writing a per-event loop. This allows you to generate an arbitrary number of event permutations. The per-event loop is configured by providing an array of objects in the JSON, where each key in the object is set to an environment variable for one pass through each event DAG for each event ID.

Let's look at the per-event loop in `hello-world/compute-array-loop.json` in this example we've taken our array event generator example and have added a per-event loop of two objects:

```json
"generator": {
  "type": "array",
  "start": 1,
  "end": 3,
  "perEventLoop": [
    {
      "CC_MODEL_PREFIX": "bardwell-creek"
    },
    {
      "CC_MODEL_PREFIX": "tuttle-creek"
    }
  ]
}
```

> Note that we've used the `CC_` prefix on these keys so that the hello-world plugin will print them out, you do not need to do that in your manifests.

```sh
cccli --envFile=.env-local --computeFile=compute-array-loop.json run
```

What we end up with here is a set of 6 events running through the 2 plugins for a total of 12 job runs of the hello-world plugin.

> You do want to be careful with key names here, they will overwrite any existing environment variable with the same key without warning.
