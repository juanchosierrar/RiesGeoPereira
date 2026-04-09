import sys
import datetime
import fsspec
import xarray as xr
import xradar as xd
import numpy as np
import matplotlib.pyplot as plt

def get_latest_radar_file(radar_name="Munchique"):
    fs = fsspec.filesystem("s3", anon=True)
    now = datetime.datetime.utcnow()
    dates_to_try = [now, now - datetime.timedelta(days=1)]
    
    for dt in dates_to_try:
        path = f"s3-radaresideam/l2_data/{dt.year}/{dt.month:02d}/{dt.day:02d}/{radar_name}/"
        try:
            files = sorted(fs.glob(path + "*"))
            if files:
                return f"s3://{files[-1]}"
        except Exception as e:
            pass
    return None

def main():
    radar_name = "Munchique"
    file_path = get_latest_radar_file(radar_name)
    if not file_path:
        print(f"Error: Could not find any files for {radar_name}")
        return

    print(f"Found file: {file_path}")
    print("Processing with xradar...")
    
    # Load keeping track of time
    import time
    start = time.time()
    stream = fsspec.open(file_path, mode="rb", anon=True).open()
    raw_data = stream.read()
    
    radar = xd.io.open_iris_datatree(raw_data)
    sweep_0 = radar["sweep_0"].to_dataset()
    
    # Georeference calculation
    # Using open_radar_science approach
    if not hasattr(sweep_0, 'x'):
         # Apply georeference manually if datatree wasn't completely mapped
         pass
    
    # Alternatively apply to the whole datatree
    try:
        radar = radar.xradar.georeference()
        sweep = radar["sweep_0"]
    except Exception as e:
        print("xradar.georeference failed", e)
        sweep = sweep_0
        
    print(f"Time taken to parse: {time.time() - start:.2f}s")
    
    # Check variables
    print("Variables:", list(sweep.data_vars))
    
    dbzh = sweep["DBZH"].values
    
    if "x" in sweep.coords and "y" in sweep.coords:
        x = sweep.coords["x"].values
        y = sweep.coords["y"].values
        print(f"Valid georeference! X shape: {x.shape}, Y shape: {y.shape}")
        
        # Save simple plot
        plt.figure(figsize=(8,8))
        plt.pcolormesh(x, y, dbzh, cmap='jet', vmin=0, vmax=60)
        plt.colorbar(label='dBZ')
        plt.savefig('test_plot.png')
        print("Saved test_plot.png")
    else:
        print("Georeferencing coordinates x,y not found!")
    
if __name__ == '__main__':
    main()
