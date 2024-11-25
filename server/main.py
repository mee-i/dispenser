import asyncio
import websockets
from gpiozero import LED

led = LED(26)

# Define a handler for WebSocket connections
async def handle_connection(websocket):
    print("New connection established")
    try:
        async for message in websocket:
            print(f"Received: {message}")
            if message == "ledon":
                print("ledon")
                led.on()
            elif message == "ledoff":
                print("ledoff")
                led.off()
            elif message == "ping":
                pong_waiter = await websocket.ping()
                await websocket.send(await pong_waiter)
            response = f"Echo: {message}"
            await websocket.send(response)
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