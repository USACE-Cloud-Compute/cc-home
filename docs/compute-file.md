# Anatomy of a compute file
The compute file bridges the gap between the plugin and compute manifests.  It contains information used by the CLI to interoperate with a compute provider and execute a compute run of one or more jobs.

The compute file uses a json structure and has the following primary sections:

| Attribute | Description |
|-----------|----------|
| `name` | the user defined name for the compute run |
| `provider` | information necessary to interoperate with the compute provider |
| `plugins` | an unordered list of plugin manifest file references |
| `event` | defines the event (a.k.a. DAG) level data  |
| `generator` | the optional event generator configuration |
| `secrets-manager` | a simple in-memory secrets manager configuration that is only used by the Docker compute provider |

Each of the configuration blocks are described below:

  - `provider`: The provider block defined the compute provider configuration.  Currently there are two supported providers:
    1. `docker`: This is the provider to run compute on a local docker instance.  Its primary purpose is to test plugins, configurations, and compute at small scale (or during development) prior to running compute at scale in a cloud environment.

        | Parameter | Description | Sample Value |
        |-----------|-------------|--------------|
        | `type` | The type of provider that will be instantiated | docker |
        | `concurrency` | The level of concurrencly the docker is allowed to use on the local system | 1 |
        | `queue` | The local queue to add jobs to.  For the Docker provider, this value should be set to "docker-local" | docker-local |

        sample docker json:
        ```json
        "provider": {
            "type": "docker",
            "concurrency": 1,
            "queue": "docker-local"
        },
        ```

    2. `awsbatch`
        | Parameter | Description | Sample Value |
        |-----------|-------------|--------------|
        | `type` | The type of provider that will be instantiated | awsbatch |
        | `execution-role` | The name of the execution role that AWS batch will use to run compute | ecsTaskExecutionRole |
        | `region` | The region the awsbatch service is hosted in | us-east-1
        | `profile` | The aws credential profile that has permission to execute AWS batch API services.  This profile should be stored in the local aws credentials file | my-compute
        | `queue` | The AWS Batch Queue to add jobs to.  Note that the queue and AWS batch compute environments must be set up in AWS prior to sending jobs  | My-AWS-Queue |

        sample aws batch json:
        ```json
        "provider":{
            "type":"awsbatch",
            "execution-role": "executionRole",
            "region": "us-west-1",
            "profile": "my_profile",
            "queue": "MEMORY-OPTIMIZED"
        },
        ``` 
  - `plugins`: This is the full list of plugin manifests that are used by the compute run. This list is required when running local docker compute, but is only required for AWS batch when registering compute.  If an event is already registered to a set of job descriptions in AWS batch, then this block is optional.  The value for each plugin manifest in the array is a path to the plugin manifest file, either absolute or relative.
    sample value:
    ```json
        "plugins": ["../common-files/ras2025-postprocessor-plugin-manifest.json"],
    ```
  - `event`: This section of the configuration is an object, although currently only one parameter "compute-manifests" is required.  Similar to plugins, the `compute-manifests` is an unordered list of the compute manifests files that make up this event.  The files can be referenced via relative or absolute paths.

  - `generator`: USACE Cloud Compute introduced the concept of event generators to provide a high degree of flexibility when running stochastic simulations.  Event generators take a single event (i.e. DAG) and create multiple jobs from it then sending each individual job into the compute provider. The individual kinds of event generators and their respective configurations are presented below.
    - `list event generator`: This is the most simple event generator and is simply a list of events with each event being an individual DAG.  If an event generator is not configured, this will be used and will run the event a single time with an event identifier of 0.  There is no way to add mulitple events to the `list event generator` using the CLI tools, but the generator can be accessed using the cloud-compute library and cloud compute golang sofrtware development kit.

    - `array event generator`: The array event generator will take a single DAG and send jobs with event identifiers between a specific set of values.  For example if you are running 1000 simulations of the same dag, you can configura a single array event generator so send all of the jobs in a single action.  Array event generators must be configured in the compute file and include the following configuration parameters:
      | Parameter | Description | Sample Value |
      |-----------|-------------|--------------|
      | `type` | The type of event generator to be instantiated | array |
      | `start`| The starting event identifier | 1 |
      | `end` | The ending event identifier | 1000 |    

      sample configuration for an array event generator that sends 1000 jobs with event identifiers starting at 1 and ending at 1000:
      ```json
      "generator":{
            "type":"array",
            "start":1,
            "end":1000
       }
      ```
    
    - `streaming event generator`: Similar to an array event generator will take a single DAG and send jobs with event identifiers for a specific set of values.  Streaming event generators must be configured in the compute file and include the following configuration parameters:
      | Parameter | Description | Sample Value |
      |-----------|-------------|--------------|
      | `type` | The type of event generator to be instantiated | stream |
      | `file`| The file containing the stream of tokens | myfile.txt |
      | `delimiter` | The delimiter for individual tokens. (this example is a newline) | "\n" |    

      When using the CLI, the stream generator will only take a file as input.  The cloud compute library allows for any streaming source such as databases or web services to be used in addition to file sources, but the user would need to connect these to a stream generator using code.
      ```json
      "generator":{
            "type": "stream",
            "file": "../failed-runs/rundebug.csv",
            "delimiter": ","
      }
      ```
    - there is an optional parameter that can be configured for both the `stream` and `array` generators.  This is the `perEventLoop` values.  When using a perEventLoop, assume we are using an array event generator starting at 1 and ending at 10, for each event in the array event generator, a separate job will be sent for each of the values in the per event loop.  The per event loop simply defines an object of key value pairs that will be written into the environment for each per event loop execution.  For example, you can configure an array event generator like this:
       ```json
       {
            "name": "Trinity AEP Grid Compute",
            "provider":{
                "type":"awsbatch",
                "execution-role": "executionRole",
                "region": "us-west-1",
                "profile": "my_compute",
                "queue": "MY_QUEUE"
            },
            "plugins": ["aep-grid-plugin-manifest-aws-docker.json"],
            "event":{
                "compute-manifests":["aep-grid-compute-manifest.json"]
            },
            "generator":{
                "type":"array",
                "start":1,
                "end":2000,
                "perEventLoop":[
                    {"MODEL_PREFIX":"bardwell-creek","DEBUG_CELL":"8162,8967"},
                    {"MODEL_PREFIX":"bedias-creek", "DEBUG_CELL":"15123,15870"},
                    {"MODEL_PREFIX":"blw-bear", "DEBUG_CELL":"8490,7323"},
                    {"MODEL_PREFIX":"blw-clear-fork", "DEBUG_CELL":"8258,4164"},
                    {"MODEL_PREFIX":"blw-east-fork", "DEBUG_CELL":"12785,10780"},
                    {"MODEL_PREFIX":"blw-elkhart", "DEBUG_CELL":"15640,12969"},
                    {"MODEL_PREFIX":"blw-richland", "DEBUG_CELL":"22054,19033"},
                    {"MODEL_PREFIX":"blw-west-fork", "DEBUG_CELL":"7851,9048"},
                    {"MODEL_PREFIX":"bridgeport", "DEBUG_CELL":"20343,10605"},
                    {"MODEL_PREFIX":"cedar-creek", "DEBUG_CELL":"5793,19696"},
                    {"MODEL_PREFIX":"chambers-creek", "DEBUG_CELL":"11582,7826"},
                    {"MODEL_PREFIX":"clear-creek", "DEBUG_CELL":"15732,13773"},
                    {"MODEL_PREFIX":"clear-fork", "DEBUG_CELL":"14886,13119"},
                    {"MODEL_PREFIX":"denton", "DEBUG_CELL":"16938,24098"},
                    {"MODEL_PREFIX":"eagle-mountain", "DEBUG_CELL":"12518,15765"},
                    {"MODEL_PREFIX":"east-fork", "DEBUG_CELL":"13652,12481"},
                    {"MODEL_PREFIX":"kickapoo", "DEBUG_CELL":"10792,22388"},
                    {"MODEL_PREFIX":"lavon", "DEBUG_CELL":"6636,13960"},
                    {"MODEL_PREFIX":"lewisville", "DEBUG_CELL":"5831,11459"},
                    {"MODEL_PREFIX":"livingston", "DEBUG_CELL":"10231,18754"},
                    {"MODEL_PREFIX":"mill-creek", "DEBUG_CELL":"13349,8211"},
                    {"MODEL_PREFIX":"mountain", "DEBUG_CELL":"9084,3871"},
                    {"MODEL_PREFIX":"ray-hubbard", "DEBUG_CELL":"6049,10608"},
                    {"MODEL_PREFIX":"ray-roberts", "DEBUG_CELL":"14439,8626"},
                    {"MODEL_PREFIX":"rchlnd-chmbers", "DEBUG_CELL":"19554,8561"},
                    {"MODEL_PREFIX":"white-rock", "DEBUG_CELL":"6043,14594"}
                ]
            }
        }
       ```
    For this configuration the generator will loop over events starting at 1 and ending at 2000, then for each event, loop over the the per event loop list, and inject the following into the compute plugin environment when it runs:
      ```bash
        CC_EVENT_IDENTIFIER={event#}
        MODEL_PREFIX={model-prefix}
        DEBUG_CELL={debug-cell}
      ``` 
    so for event 500 and the first per event loop value, the plugin would get the following in its environment:
      ```bash
        CC_EVENT_IDENTIFIER=500
        MODEL_PREFIX=bardwell-creek
        DEBUG_CELL=8162,8967
      ``` 
    
----


`Event identifier`: USACE Cloud Compute uses the concept of an event identifier which is injected into the compute environment as the variable CC_EVENT_IDENTIFIER.  This value is a string and can be anything the plugin needs to incorporate into its compute, from a simple integer event number, to a set of values the plugin can process using its own logic.