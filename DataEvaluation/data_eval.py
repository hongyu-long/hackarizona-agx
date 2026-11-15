import csv

def main():
    # Read the CSV file
    with open("data_arizona_orchard_weather.csv", 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        data = list(reader)

    # Print the first 5 rows of the dataset
    for row in data[:5]:
        print(row)

main()