import csv

class WeatherData:
    def __init__(self, timestamp, temperature_5ft_C, temperature_30ft_C, wind_speed_5ft_mph, wind_speed_30ft_mph, wind_direction_5ft_deg, wind_direction_30ft_deg):
        self.timestamp = timestamp
        self.temperature_5ft_C = float(temperature_5ft_C)
        self.temperature_30ft_C = float(temperature_30ft_C)
        self.wind_speed_5ft_mph = float(wind_speed_5ft_mph)
        self.wind_speed_30ft_mph = float(wind_speed_30ft_mph)
        self.wind_direction_5ft_deg = float(wind_direction_5ft_deg)
        self.wind_direction_30ft_deg = float(wind_direction_30ft_deg)
        self.temp_difference = False
    
    def flag_temp_difference(self):
        if self.temperature_30ft_C > self.temperature_5ft_C:
            self.temp_difference = True
        else:
            self.temp_difference = False


def main():
    # Read the CSV file
    with open("data_arizona_orchard_weather.csv", 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        data = list(reader)

    weather_data_list = []

    for row in data:
        data_point = WeatherData(row[0], row[1], row[2], row[3], row[4], row[5], row[6])
        data_point.flag_temp_difference()
        weather_data_list.append(data_point)

main()