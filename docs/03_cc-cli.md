# Cloud Compute CLI (Command Line Interface)

Previously known as the `Manifestor`, the CC CLI is the primary tool used to interact with the Cloud Compute ecosystem at this time.

## Download CC CLI

Pre-compiled binaries for CC CLI are available on GitHub at the releases page for the CLI project: [https://github.com/USACE-Cloud-Compute/cloudcompute-cli/releases](https://github.com/USACE-Cloud-Compute/cloudcompute-cli/releases). Download the version that matches your computer's operating system and CPU architecture.

- **Windows Users** - `cccli-windows-amd64.exe`
- **Intel Mac Users** - `cccli-darwin-amd64`
- **M-series Mac Users** - `cccli-darwin-arm64`

Download and save the executable to your computer. Rename the file `cccli` and put the file in a location that is available on your PATH so that it will be executable from the command line. Since this process can vary based on your local configuration, if you have any questions or run into issues let us know on the [discussions page](https://github.com/orgs/USACE-Cloud-Compute/discussions).

## Confirm the CLI is Working

Once you have that set up you should be able to run `cccli --help` and see the following message below:

```
CloudCompute CLI to run, register, terminate, and fetch logs for cloud compute.

Usage:
  cccli [command]

Available Commands:
  help        Help about any command
  log         Get job logs from a compute provider
  register    Register plugins with a compute provider.
  run         Run the compute job
  schema      Export a json schema for a compute manifest or plugin manifest.
  status      status summaries
  terminate   Terminate job(s) on a compute provider
  version     prints the cli version number

Flags:
  -c, --computeFile string   Path to compute file
  -e, --envFile string       Path to env file
  -h, --help                 help for cccli

Use "cccli [command] --help" for more information about a command.
```

## Available Commands

Let's walk through the different commands you can use with `cccli`, we'll go through these in roughly the order you might need to use them.

**`cccli help`** - prints the message shown above. For help on a specific command you can type `cccli help [command]`.

**`cccli version`** - prints version information for the currently installed `cccli` for example:

```sh
CLI Version: 1.0.8
Build: v1.0.8-0-gaa42e68
Date: 2025-12-02T19:56:14Z
```

**`cccli schema`** - exports a JSON schema document for either a compute or plugin manifest. This is helpful to use as a reference for the available keys for those files in addition to the guides here. To write the schema to a file you can redirect the output to a file like `cccli schema plugin > plugin-schema.json`.

**`cccli register`** - registers a plugin with a compute environment.

```
cccli --envFile=.env --computeFile=compute.json register
```

--Note-- When running a compute using the local Docker compute provider, CC will automatically register the plugin before running.

**`cccli run`** - start a compute. Optionally you can tell `cccli` to write out a file with all of the jobs and their IDs using the `--jobStore` option.

```
cccli --envFile=.env --computeFile=compute.json run
```

Note that the Compute, Event, and Job Identifiers are created and used by cloud compute. The ComputeProviderJob is the identifier natively used by the compute provider. The payload GUID represents the folder in the cloud compute store that holds the jobs payload and the event identifier is the string identifier injected into the environment for each run.

**`cccli status`** - get the status of an operation

```
cccli --envFile=.env --computeFile=compute.json status
```

**`cccli log`** - extract job logs from the compute provider.

```
cccli --envFile=.env --computeFile=compute.json log
```

**`cccli terminate`** - terminate a job, event or compute in the compute provider.

`terminate` takes three arguments, `level`, `identifier` and `termination-message`:

`level` - one of `COMPUTE | EVENT | JOB` denoting what level operation you want to terminate.

`identifier` - GUID of the compute, event or job to be terminated.

`termination-message` - message that will be logged as the operations are terminated, usually a reason for the termination.

```
cccli --envFile=.env --computeFile=compute.json terminate COMPUTE 068ff6fe-d8d9-48af-b897-b937a7e14dae "testing the things"
```

**Next Step**

At this point there are two options for what to do next:

- [Hello World Tutorial](../tutorials/hello-world)
- [Advanced CC Topics (plugin registration, manifest authoring, etc)](./04_advanced-topics.md)
