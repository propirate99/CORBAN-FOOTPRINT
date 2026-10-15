# Domain Assumptions & Factor Methodology

## 1. Electrical Grid Emission Factors
- **Regional Grid Standard**: 0.42 kg $CO_2e$ per kWh (Standard regional average for mixed fossil/renewable commercial grid).
- **Peak Hour Penalty**: Multiplier of 1.25x applied between 14:00 - 18:00 due to peaker plant activation.
- **Solar Offset**: Zero operational carbon factor (-0.42 kg $CO_2e$ credit per kWh generated).

## 2. Equipment Baseline Wattages
| Equipment Type | Active Power (W) | Standby Power (W) | Typical Operational Duty |
| :--- | :--- | :--- | :--- |
| Variable Refrigerant HVAC | 3,500 W | 120 W | Continuous during schedule |
| Classroom LED Array (20 tubes)| 400 W | 5 W | Manual switch |
| Projector & AV Rack | 380 W | 25 W | Active during lectures |
| Workstation Lab (30 PCs) | 4,500 W | 300 W | Class / Student lab usage |

## 3. Occupancy Rules
- **Vacant Room Threshold**: `personCount == 0` for $\ge 10$ continuous minutes.
- **Under-Utilized Room**: `personCount < 0.20 * capacity` for $> 30$ minutes.
- **Detection Confidence Minimum**: Observations with confidence $< 0.55$ are ignored to prevent flickering false alarms.
