
import numpy as np
import pandas as pd

np.random.seed(42)

# Dataset configuration
days = 30
interval_minutes = 10
samples_per_day = 24 * 60 // interval_minutes
n = days * samples_per_day

# Timestamps
time = pd.date_range(
    start="2026-06-01",
    periods=n,
    freq=f"{interval_minutes}min"
)

hour = time.hour + time.minute / 60
day = np.arange(n) / samples_per_day

# Missouri-wide representative June temperatures
# Typical warm days and cooler nights
# Includes gradual seasonal warming and weather variability

daily_temperature = (
    23.5
    + 6.5 * np.sin(2 * np.pi * (hour - 9) / 24)
    + 1.5 * np.sin(2 * np.pi * day / 20)
    + 1.0 * np.sin(2 * np.pi * day / 6)
)

temperature_5ft = (
    daily_temperature
    + np.random.normal(0, 1.0, n)
)

# Temperature at 30 feet
# Daytime mixing and nighttime temperature inversions

night = (hour < 7) | (hour > 20)

temperature_difference = np.random.normal(
    -0.4, 0.35, n
)

inversion_conditions = (
    night & (np.random.random(n) < 0.55)
)

temperature_difference[inversion_conditions] = (
    np.random.uniform(
        0.3, 3.0, inversion_conditions.sum()
    )
)

temperature_30ft = (
    temperature_5ft + temperature_difference
)

# Wind speed at 5 feet (mph)
# Moderate Missouri summer winds

wind_base = (
    5
    + 2.0 * np.sin(2 * np.pi * (hour - 12) / 24)
)

wind_5ft = np.clip(
    wind_base + np.random.normal(0, 1.5, n),
    0.2, 18
)

# Wind speed at 30 feet (mph)
# Higher wind speeds at greater elevation

wind_30ft = np.clip(
    wind_5ft + np.random.normal(1.2, 1.5, n),
    0.2, 22
)

# Wind direction at 5 feet (degrees)
# Variable Missouri summer winds
# South and southwest flow is common in summer

wind_direction_5ft = (
    210
    + 30 * np.sin(2 * np.pi * day / 7)
    + np.random.normal(0, 25, n)
) % 360

# Wind direction at 30 feet (degrees)
# Slight directional variation with height

wind_direction_30ft = (
    wind_direction_5ft
    + np.random.normal(0, 15, n)
) % 360

# Create dataset
df = pd.DataFrame({
    "timestamp": time,
    "temperature_5ft_C": temperature_5ft.round(2),
    "temperature_30ft_C": temperature_30ft.round(2),
    "wind_speed_5ft_mph": wind_5ft.round(2),
    "wind_speed_30ft_mph": wind_30ft.round(2),
    "wind_direction_5ft_deg": wind_direction_5ft.round(1),
    "wind_direction_30ft_deg": wind_direction_30ft.round(1)
})

# Export CSV
filename = "missouri_statewide_weather.csv"
df.to_csv(filename, index=False)

print(f"Dataset generated: {filename}")
print(f"Total records: {len(df)}")
print(df.head())

# Summary statistics
print("\nWeather Summary:")
print(df.describe().round(2))
