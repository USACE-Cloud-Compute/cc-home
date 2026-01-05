## Compute HEC-ResSim
The purpose of this is to compute HEC-ResSim with the correct starting pool elevations from HEC-HMS, the correct inflows from HEC-HMS, and the correct time window from HEC-HMS. Breach trigger elevations are also copied in to give HEC-ResSim the ability to monitor pool elevations compared to breach triggers at dams to change operations if breach trigger elevations are exceeded.

## Relevant Actions documentation
https://github.com/USACE-Cloud-Compute/ressim-runner/blob/main/src/main/java/usace/cc/plugin/ressimrunner/DsstoDssAction.md
https://github.com/USACE-Cloud-Compute/ressim-runner/blob/main/src/main/java/usace/cc/plugin/ressimrunner/UpdateTimeWindowFromDssAction.md
https://github.com/USACE-Cloud-Compute/ressim-runner/blob/main/src/main/java/usace/cc/plugin/ressimrunner/ComputeAction.md
https://github.com/USACE-Cloud-Compute/ressim-runner/blob/main/src/main/java/usace/cc/plugin/ressimrunner/PostPeaksAction.md

## parametrization for the tutorial
# dss_to_dss
| Attribute | Description | Value |
|-----------|----------|-------------|
| `fill_empty_values` | a flag to fill empty values with the previous timestep or not | true |

# updated_timewindow_from_dss
| Attribute | Description | Value |
|-----------|----------|-------------|
| `lookback_duration` | the number of lookback duration units | 1 |
| `lookback_units` | the unit of the lookback duration (options hours, minutes, days) | hours |

# compute_simulation
| Attribute | Description | Value |
|-----------|----------|-------------|
| `project-file` | the location of the storms as dss files | /conformance/storm-catalog/storms/ |

# post_peaks
| Attribute | Description | Value |
|-----------|----------|-------------|
| `exported-peak-paths` | the dss record pathnames that need to be summarized for peak data, this needs to include all parameters being utilized in plots and in calculating ams contributing events.  | see compute manifest |
| `exported-peak-durations` | durations that the peaks will be computed for | [1,24,48,72] |

## required inputs

| Datasource Name | Path Key | Path Value (resolved from substitution) |
|-----------|----------|-------------|
| /model/ffrd_trinity | wksp | conformance/reservoir-operations/ffrd_trinity/ffrd_trinity.wksp |
| /model/ffrd_trinity | projection | conformance/reservoir-operations/ffrd_trinity/Trinity_FFRD.projection |
| /model/ffrd_trinity | stream.align | conformance/reservoir-operations/ffrd_trinity/stream.align |
| /model/ffrd_trinity | fragility-samples | conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/system-response/failure_elevations.json |
| /model/ffrd_trinity | dam_ids | conformance/reservoir-operations/ffrd_trinity/dam_ids.json |
| /model/ffrd_trinity/rss/ | simperiod | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd.simperiod |
| /model/ffrd_trinity/rss/ | rss.conf | conformance/reservoir-operations/ffrd_trinity/rss/rss.conf |
| /model/ffrd_trinity/rss/ | Obs.fits | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrdObs.fits |
| /model/ffrd_trinity/rss/fema_ffrd/ | wksp | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/fema_ffrd.wksp |
| /model/ffrd_trinity/rss/fema_ffrd/ | stream.align | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/stream.align |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | simrun | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-.simrun |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | rssrun | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0.rssrun |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | dss | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_Extended.dss |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | rsys | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_Extended.rsys |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | fits | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_fema_ffrd.fits |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | igv | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_fema_ffrd.igv |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | malt | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_fema_ffrd.malt |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | ralt | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_fema_ffrd.ralt |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | Op.dbf | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_ExtendedOp.dbf |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | Op.dbt | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_ExtendedOp.dbt |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | Op.mdx | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_ExtendedOp.mdx |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | SysOp.dbf | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_ExtendedSysOp.dbf |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | SysOp.dbt | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_ExtendedSysOp.dbt |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | SysOp.mdx | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/fema_ffrd-0_Trinity_CWMS_ExtendedSysOp.mdx |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | resop.dbt | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/resop.dbt |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | resop.dbf | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/resop.dbf |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | resop.mdx | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/resop.mdx |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | ressysop.dbf | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/ressysop.dbf |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | ressysop.dbt | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/ressysop.dbt |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | ressysop.mdx | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/ressysop.mdx |
| /model/ffrd_trinity/rss/fema_ffrd/rss/ | rss.conf | conformance/reservoir-operations/ffrd_trinity/rss/fema_ffrd/rss/rss.conf |
| /model/ffrd_trinity/shared/ | breach-tracker | conformance/reservoir-operations/ffrd_trinity/shared/breach_tracker_config.csv |
| /model/ffrd_trinity/shared/ | hms-output | conformance/simulations/event-data/{ENV::CC_EVENT_IDENTIFIER}/hydrology/SST.dss|