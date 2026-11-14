import csv
import random

def generate_global_data():
    locations = []
    
    # Generate 10,000 Antarctic/Deep Polar coordinates (The likely Artemis Matches)
    for i in range(10000):
        locations.append({
            "location_name": f"Antarctic Grid Alpha-{i}",
            "country": "Antarctica",
            "lat": round(random.uniform(-90.0, -75.0), 4),
            "lng": round(random.uniform(-180.0, 180.0), 4),
            "min_temp_c": round(random.uniform(-89.0, -40.0), 1), # Extreme Cold
            "slope_deg": round(random.uniform(5.0, 25.0), 1)      # Crater-like slopes
        })
        
    # Generate 5,000 Arctic/Greenland coordinates
    for i in range(5000):
        locations.append({
            "location_name": f"High Arctic Permafrost-{i}",
            "country": "Canada/Greenland",
            "lat": round(random.uniform(70.0, 85.0), 4),
            "lng": round(random.uniform(-100.0, -10.0), 4),
            "min_temp_c": round(random.uniform(-50.0, -20.0), 1),
            "slope_deg": round(random.uniform(2.0, 20.0), 1)
        })

    # Generate 10,000 Desert/Equator coordinates (To prove the AI knows what NOT to pick)
    for i in range(10000):
        locations.append({
            "location_name": f"Equatorial Arid Zone-{i}",
            "country": "Global Deserts",
            "lat": round(random.uniform(-30.0, 30.0), 4),
            "lng": round(random.uniform(-180.0, 180.0), 4),
            "min_temp_c": round(random.uniform(10.0, 45.0), 1),
            "slope_deg": round(random.uniform(0.0, 10.0), 1)
        })

    # Save to CSV
    with open('earth_analogs.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["location_name", "country", "lat", "lng", "min_temp_c", "slope_deg"])
        writer.writeheader()
        writer.writerows(locations)
        
    print("Successfully generated earth_analogs.csv with 25,000 global coordinates!")

if __name__ == "__main__":
    generate_global_data()