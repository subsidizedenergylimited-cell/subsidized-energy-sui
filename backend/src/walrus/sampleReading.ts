// Realistic daily solar inverter reading for testnet demos.
export const sampleReading = {
  producer:       "0xdcad9f598343948f03bedbee6bd618fca4bacdb4ffd120e96d26f7f8d6d92901",
  production_day: 20260611,       // YYYYMMDD
  watt_hours:     6400,           // 6.4 kWh as integer Wh

  // Raw inverter block — the data that justifies the watt_hours claim.
  inverter: {
    serial:              "SN-GW5KTL-20240312-007",
    model:               "Goodwe GW5000-NS",
    timestamp_utc:       "2026-06-11T17:45:00Z",
    epv_today_kwh:       6.4,
    epv_lifetime_kwh:    1842.7,
    pac_w:               3210,    // AC output at time of reading
    temperature_c:       46.2,
    grid_frequency_hz:   50.01,
  },
};
