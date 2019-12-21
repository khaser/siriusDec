#!/usr/bin/env python3.7
################################################################################
# Четвертая версия сервера.
# Актуальная.
################################################################################

import asyncio
import logging
import random
import quart

app = quart.Quart(__name__, template_folder="templates", static_folder="static")

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG, format="> %(asctime)-15s %(levelname)-8s || %(message)s")

@app.route("/")
async def index():
    return await quart.render_template("index.html")

@app.route("/p/<name>")
async def handle_p(name):
    return await quart.render_template(f"p_{name}.html")

@app.route("/j/<name>")
async def handle_j(name):
    return await quart.render_template(f"j_{name}.js")

queues = set()

@app.websocket("/ws")
async def handle_ws():
    global queues

    user = f"{quart.websocket.remote_addr}#{random.randint(1000, 9999)}"
    queue = asyncio.Queue()

    async def sending():
        while True:
            data = await queue.get()
            log.info("Пользователь %s: SEND[%r symbols]", user, len(data))
            await quart.websocket.send(data)

    async def receiving():
        while True:
            data = await quart.websocket.receive()
            log.info("Пользователь %s: RECV[%r symbols]", user, len(data))
            for queue1 in queues:
                await queue1.put(data)

    try:
        log.info("Пользователь %s подключился :)", user)
        queues.add(queue)
        producer = asyncio.create_task(sending())
        consumer = asyncio.create_task(receiving())
        await asyncio.gather(producer, consumer)
    finally:
        log.info("Пользователь %s отключился :(", user)
        queues.remove(queue)


def main():
    app.config.from_mapping(DEBUG=True, ENV="dev")
    app.run(host='0.0.0.0', port=80)

if __name__ == "__main__":
    main()
