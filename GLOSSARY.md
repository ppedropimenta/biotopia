# Aquarium platform

A web platform for freshwater fishkeepers: they log their tanks' water and maintenance, and later check
species, compatibility and biotopes against data that always shows its source.

## Language

### Tanks

**Tank**:
One physical freshwater aquarium kept by one owner. A tank is either active or archived.
_Avoid_: Aquarium, setup

**Archived Tank**:
A tank that is no longer running. Its history stays and can still be viewed.
_Avoid_: Deleted tank, old tank

**Demo Tank**:
The one real, running tank that anyone can view without an account, read-only. Its owner keeps logging it
like any other tank, so its history keeps growing.
_Avoid_: Sample tank, sandbox, public tank

**Tank Photo**:
A dated picture of a tank, with an optional note. Together they show how the tank changed over time; the
most recent one represents the tank.
_Avoid_: Image, gallery, cover

**Net Volume**:
The amount of water a tank actually holds, as stated by its owner, after substrate and decoration. It is
never estimated from the tank's dimensions.
_Avoid_: Volume, liters, gross volume

### Water

**Parameter**:
A water property the platform knows how to read and reason about, such as temperature, pH or nitrate. The
list is fixed by the platform, not by owners, and no parameter is ever required.
_Avoid_: Metric, value, reading type

**Measurement**:
One value of one parameter in one tank at one point in time, with an optional note.
_Avoid_: Reading, test, sample, test session

**Total Ammonia**:
The combined ammonia and ammonium (NH3 + NH4+) that a test kit reports. Free ammonia (NH3), the toxic
part, is always derived from it together with pH and temperature, never measured.
_Avoid_: Ammonia, NH3, NH4

### Care

**Maintenance**:
A record of care work already done on a tank. Its type is one of Water Change, Top-up, Filter Cleaning,
Fertilizing, Pruning, Substrate Cleaning or Other; Other always says what was done. A session that did several
things (a water change and a filter cleaning) is several Maintenance at the same moment, one for each type.
_Avoid_: Task, chore, schedule, reminder

**Water Change**:
Maintenance that replaces part of a tank's water, recorded as the percentage replaced.
_Avoid_: Water swap, refill

**Top-up**:
Maintenance that only adds water to make up for evaporation, without removing any.
_Avoid_: Refill, water change
