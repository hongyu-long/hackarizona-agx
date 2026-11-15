
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

# Temperature at 5 feet (Arizona summer)
daily_temperature = (
    31
    + 12 * np.sin(2 * np.pi * (hour - 9) / 24)
    + 1.5 * np.sin(2 * np.pi * day / 15)
)

temperature_5ft = (
    daily_temperature
    + np.random.normal(0, 0.7, n)
)

# Temperature at 30 feet
# Simulated vertical temperature variation
night = (hour < 7) | (hour > 20)

temperature_difference = np.random.normal(
    -0.7, 0.4, n
)

inversion_conditions = (
    night & (np.random.random(n) < 0.70)
)

temperature_difference[inversion_conditions] = (
    np.random.uniform(
        0.5, 4.5, inversion_conditions.sum()
    )
)

temperature_30ft = (
    temperature_5ft + temperature_difference
)

# Wind speed at 5 feet (mph)
wind_base = (
    5
    + 3 * np.sin(2 * np.pi * (hour - 12) / 24)
)

wind_5ft = np.clip(
    wind_base + np.random.normal(0, 1.5, n),
    0.1, 16
)

# Wind speed at 30 feet (mph)
wind_30ft = np.clip(
    wind_5ft + np.random.normal(1.5, 1.8, n),
    0.1, 20
)

# Wind direction at 5 feet (degrees)
wind_direction_5ft = (
    230
    + 35 * np.sin(2 * np.pi * day / 7)
    + np.random.normal(0, 18, n)
) % 360

# Wind direction at 30 feet (degrees)
wind_direction_30ft = (
    wind_direction_5ft
    + np.random.normal(0, 18, n)
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
filename = "arizona_orchard_weather.csv"
df.to_csv(filename, index=False)

print(f"Dataset generated: {filename}")
print(f"Total records: {len(df)}")
print(df.head())
