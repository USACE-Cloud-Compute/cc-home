# Advanced Topics

> If you haven't already, please run through the hello-world tutorial to get a feel for the CC basics, once that's completed, come back here to do a deeper dive on some more advanced CC topics.

There are a number of files that we used in the hello-world tutorial, each of which provide important information to CC allowing it to orchestrate computes on our behalf. Let's walk through each of the types of files and look at the options available for each.

## Plugin Manifest

The plugin manifest file is used to establish what will run and what resources need to be provisioned for it. It is primarily used to "register" a plugin with a compute provider and is analogous to a job description in AWS Batch.

[Anatomy of a Plugin Manifest](./05_plugin-manifest.md)

### Plugin Registration

Plugins must be registered with CC in order to be used in the AWS compute provider. Using the local compute provider automatically registers plugins with the run command so you do not have to register plugins separately.

To register a plugin use the `register` command of `cccli`:

```sh
cccli --envFile=.env --computeFile=compute.json register
```

By default, all plugins referenced in the compute file DAG will be registered. Optionally the command can include a file path to a plugin manifest. If this option is provided, then the register function will only register the given plugin manifest.

## Compute Manifest

A compute manifest represents the configuration for one or more computes (a.k.a. "jobs") that will run on the compute provider. It contains the information necessary to execute the compute (variables required by the plugin), what actions to run during the compute, connections to remote data stores, and data sources or outputs that will be used to retrieve or transfer data during the run. Additionally, it can be used to override some of the attributes configured for the plugin manifest such as resource requirements, timeout values, or retry requirements.

[Anatomy of a Compute Manifest](./06_compute-manifest.md)

## Compute File

The compute file bridges the gap between the plugin and compute manifests. It contains information used by the CLI to interoperate with a compute provider and execute a compute run of one or more jobs.

[Anatomy of a Compute File](./07_compute-file.md)
