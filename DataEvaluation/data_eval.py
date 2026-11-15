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
        
        # Flags
        self.temp_difference = False
        self.wind_below_3mph = False
        self.wind_above_10mph = False
        self.large_difference = False
        
    
    def get_5ft_temp(self):
        return self.temperature_5ft_C
    
    def get_30ft_temp(self):
        return self.temperature_30ft_C
    
    def get_5ft_windspeed(self):
        return self.wind_speed_5ft_mph
    
    def get_30ft_windspeed(self):
        return self.wind_speed_30ft_mph
    
    def get_5ft_direction(self):
        return self.wind_direction_5ft_deg
    
    def get_30ft_direction(self):
        return self.wind_direction_30ft_deg
    
    def flag_temp_difference(self):
        if self.temperature_30ft_C > self.temperature_5ft_C:
            self.temp_difference = True
        else:
            self.temp_difference = False
            
    def flag_large_difference(self):
        five_feet_wind_speed = self.get_5ft_windspeed()
        thirty_feet_wind_speed = self.get_30ft_windspeed()
        
        diff = abs(thirty_feet_wind_speed - five_feet_wind_speed)
        if diff > 2:
            self.large_difference = True
            
        return diff
        
        
    def flag_windspeed_too_low(self):
        five_feet_wind_speed = self.get_5ft_windspeed()
        thirty_feet_wind_speed = self.get_30ft_windspeed()
        
        if five_feet_wind_speed < 3:
            self.wind_below_3mph = True
               
        if thirty_feet_wind_speed < 3:
            self.wind_below_3mph = True
        
             
    def flag_windspeed_too_high(self):
        five_feet_wind_speed = self.get_5ft_windspeed()
        thirty_feet_wind_speed = self.get_30ft_windspeed()
        
        if five_feet_wind_speed > 10:
            self.wind_above_10mph = True
        
        if thirty_feet_wind_speed > 10:
            self.wind_above_10mph = True
        
        

def main():
    # Read the CSV file
    with open("data_arizona_orchard_weather.csv", 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        data = list(reader)

    weather_data_list = []

    for row in data:
        data_point = WeatherData(row[0], row[1], row[2], row[3], row[4], row[5], row[6])
        data_point.flag_temp_difference()
        data_point.flag_windspeed_too_high()
        data_point.flag_windspeed_too_low()
        difference_in_speed = data_point.flag_large_difference()
        weather_data_list.append(data_point)
        

main()