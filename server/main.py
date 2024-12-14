import asyncio
import time
import websockets
import json

from gpiozero import LED, DistanceSensor

# Response status
class status:
    OK = 'OK'
    ERROR = 'ERROR'
    
# Order options
class order:
    drink1 = 'drink1'
    drink2 = 'drink2'
    
# Message types
class msgtype:
    order = 'order'
    done = 'done'
    cancelled = 'cancelled'
    movement_detected = 'movement_detected'
    dispense_pause = 'dispense_pause'
    dispense_resume = 'dispense_resume'
    cup_error = 'cup_error'
    cup_wait_taken = 'cup_wait_taken'
    system_error = 'system_error'
    get_data = 'get_data'
    data = 'data'
    order_timeout = 'order_timeout'
    
# Dispensing duration (in second(s))
dispensing_duration: float = 5

# Status LED
led = LED(26)

# Connection to motors' relays
# coffee, juice
motors = [ LED(12), LED(13) ] # TO DO

# Cup detector sensor
cup_detector = DistanceSensor(echo=17, trigger=4)

# Drink menu
drink_memu = {
    order.drink1: 'Coffee',
    order.drink2: 'Juice'
}

# If the distance outside this range, the machine will
# alert the customer to put the cup or check the cup position.
# Also will stop dispensing if the machine is dispensing
# the drink.
# The value is in cm
minimum_cup_proximity: int = 9
maximum_cup_proximity: int = 3

# Cup proximity sensing interval in second
# The shorter interval, faster update rate.
# The longer interval, the slower update rate.
# NOTE: The shorter interval may slow down the program or even the device, and vice versa.
proximity_sensing_interval: float = 0.1

# Updated when [dispense_drink] started and ended
is_dispensing: bool = False

# Threshold to determine whether a proximity change or a position change of the cup
# will cause dispenser to pause the dispensing process or not.
# The value is in cm
movement_threshold: int = 2



# ###
# Get the distance value from ultrasonic sensor
# Return value is in cm
def get_distance() -> int:
    global cup_detector
    return cup_detector.distance * 100



# ###
# Check the cup proximity
def check_cup_proximity() -> bool:
    global minimum_cup_proximity, maximum_cup_proximity
    distance = get_distance() * 100
    return distance <= minimum_cup_proximity and distance >= maximum_cup_proximity



class order_process_system:
    remaining_duration: float = 0
    dispensing_process = None
    connection = None
    option: str = ""
    
    # ###
    # Check order process
    def is_running() -> bool:
        return dispensing_process != None
    
    # ###
    # Start order process
    async def start(self, option: str, connection) -> bool:
        global dispensing_duration
        if self.dispensing_process != None:
            print("Order process already started")
            return False
        self.remaining_duration = dispensing_duration
        self.connection = connection
        self.dispensing_process = asyncio.create_task(self.process())
        self.option = option
        return True
        
    # ###
    # Process the order
    async def process(self) -> None:
        print("Processing...")
        global proximity_sensing_interval
        print("Remaining duration:", self.remaining_duration, "s")
        while self.remaining_duration > 0:
            print("Remaining duration:", self.remaining_duration, "s")
            if not check_cup_proximity():
                print("Out of range")
                # await self.connection.send(json.dumps({
                #     'status': status.ERROR,
                #     'type': msgtype.cup_error,
                # }))
                print("Send error")
                while not check_cup_proximity(): await asyncio.sleep(proximity_sensing_interval)
            # await self.connection.send(json.dumps({
            #     'status': status.OK,
            #     'type': msgtype.dispense_resume,
            # }))
            print("Send resume")
            print("Dispense resume")
            await asyncio.sleep(1)
            await self.dispense_drink()
        print("Done")
        await asyncio.sleep(1)
        await self.connection.send(json.dumps({
            'status': status.OK,
            'type': msgtype.done,
        }))
        self.dispensing_process = None
        
    # ###
    # Dispense the drink, returns the remaining duration
    async def dispense_drink(self) -> None:
        global motors, proximity_sensing_interval, is_dispensing
        is_dispensing = True
        
        selected_motor = motors[0] if self.option == order.drink1 else motors[1]
        
        selected_motor.on() # turn on the motor
        
        # Start the timer
        start_time = time.perf_counter()
        
        # returns float
        get_remaining_duration = lambda: time.perf_counter() - start_time
        
        # returns boolean
        done = lambda: get_remaining_duration() <= 0
        
        # Check the cup proximity with the set interval while
        # dispensing the drink
        while check_cup_proximity() and not done():
            await asyncio.sleep(min(get_remaining_duration(), proximity_sensing_interval))
            self.remaining_duration = get_remaining_duration()
            print("Remaining:", self.remaining_duration, "s")
            
        selected_motor.off() # turn off the motor
        
        is_dispensing = False
        if not done():
            self.remaining_duration = get_remaining_duration()
        
        # Zero means the menu is done dispensed
        self.remaining_duration = 0.0



order_process = order_process_system()



# ###
# Define a handler for WebSocket connections
async def handle_connection(websocket) -> None:
    global order_process
    
    print("New connection established")
    try:
        async for message in websocket:
            print(f"Received: {message}")
            data = json.loads(message)
            
            response = {}
            
            if data['type'] == msgtype.order:
                # Process the incoming order
                if not await order_process.start(data["option"], websocket):
                    await websocket.send(json.dumps({
                        'status': status.ERROR,
                        'type': msgtype.system_error
                    }))
            elif data['type'] == msgtype.get_data:
                await websocket.send(json.dumps({
                    'status': status.OK,
                    'type': msgtype.data,
                    'data': 'on_process' if order_process.is_running() else 'ready'
                }))
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed: {e}")



# Start the WebSocket server
async def main():
    server = await websockets.serve(handle_connection, "0.0.0.0", 8765)
    print("WebSocket server running on ws://0.0.0.0:8765")
    await server.wait_closed()



# Run the server
if __name__ == "__main__":
    asyncio.run(main())