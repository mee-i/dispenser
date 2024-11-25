import asyncio
import websockets
from gpiozero import LED
import json

# Response status
class status:
    OK = 'OK'
    ERROR = 'ERROR'
    
# Order options
class order:
    coffee = 'coffee'
    juice = 'juice'
    
# Message types
class msgtype:
    order = 'order'
    done = 'done'
    error = 'error'
    
# Dispensing duration (in second(s))
motor_duration = 5

# Status LED
led = LED(26)

# Connection to motors' relays
# coffee, juice
motors = [ LED(99), LED(99) ] # TO DO

async def process_order(option):
    global motors, motor_duration
    selected_motor = motors[0] if option == order.coffee else motors[1]
    
    selected_motor.on() # turn on the motor
    await asyncio.sleep(motor_duration) # wait until dispenser finish dispensing the drink
    selected_motor.off() # turn off the motor

# Define a handler for WebSocket connections
async def handle_connection(websocket):
    print("New connection established")
    try:
        async for message in websocket:
            print(f"Received: {message}")
            data = json.loads(message)
            
            response = {}
            
            match message['type']:
                case 'order':
                    # Process the incoming order
                    await process_order(message['option'])
                    await websocket.send(json.dumps({
                        'status': status.OK,
                        'type': msgtype.done,
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