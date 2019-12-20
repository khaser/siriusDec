#!/usr/bin/env python3.7

import asyncio
import logging
import quart


app = quart.Quart(__name__, template_folder="templates", static_folder="static")
log = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG, format="> %(asctime)-15s %(levelname)-8s || %(message)s")

@app.route("/")
async def index():
    return await quart.render_template("index.html")


# Шаг 1.
# Хендл, который просто шлёт в ответ то же самое сообщение.
@app.websocket("/ws1")
async def ws1():
    while True:
        data = await quart.websocket.receive()
        log.info(f"Получили от браузера %r", data)
        await quart.websocket.send(f"Подтверждаем, что получили '{data}'!")


# Шаг 2.
# Хендл, который шлёт раз в секунду текущее время сервера.
# Важно, что в такой структуре кода развязаны циклы получения и отправки.
# Это создает возможность отправлять сообщение от сервера к браузеру
# не дожидаясь (как в шаге 1) сначала получения сообщения.
@app.websocket("/ws2")
async def ws2():
    user = quart.websocket.remote_addr

    async def sending():
        import datetime
        while True:
            data = "Время " + str(datetime.datetime.now())
            log.info("Пользователь %s: SEND[%r]", user, data)
            await quart.websocket.send(data)
            await asyncio.sleep(1)

    async def receiving():
        while True:
            data = await quart.websocket.receive()
            log.info("Пользователь %s: RECV[%r]", user, data)

    try:
        log.info("Пользователь %s подключился :)", user)
        producer = asyncio.create_task(sending())
        consumer = asyncio.create_task(receiving())
        await asyncio.gather(producer, consumer)
    finally:
        log.info("Пользователь %s отключился :(", user)


# Шаг 3.
# Связывем циклы получения и отправки сообщений через очередь.
# Функционально то же самое, что и в ws1, но теперь мы можем в очередь на отправку
# добавлять новые сообщения.

users = set()

@app.websocket("/ws3")

async def ws3():
    global users
    user = quart.websocket.remote_addr
    queue = asyncio.Queue()
    users.add(queue)
    
    async def sending():
        while True:
            data = await queue.get()
            log.info("Пользователь %s: SEND[%r]", user, data)
            await quart.websocket.send(data)

    async def receiving():
        while True:
            data = await quart.websocket.receive()
            log.info("Пользователь %s: RECV[%r]", user, data)
            for i_queue in users:
                await i_queue.put(data)

    try:
        log.info("Пользователь %s подключился :)", user)
        producer = asyncio.create_task(sending())
        consumer = asyncio.create_task(receiving())
        await asyncio.gather(producer, consumer)
    finally:
        log.info("Пользователь %s отключился :(", user)


@app.websocket("/ws4")

async def ws4():
    user = quart.websocket.remote_addr
    queue = asyncio.Queue()
    users.add(queue)
    
    async def sending():
        while True:
            data = await queue.get()
            #log.info("Пользователь %s: SEND[%r]", user, data)
            await quart.websocket.send(data)

    async def receiving():
        while True:
            data = await quart.websocket.receive()
            #log.info("Пользователь %s: RECV[%r]", user, data)
            for i_queue in users:
                await i_queue.put(data)

    try:
        log.info("Пользователь %s подключился :)", user)
        producer = asyncio.create_task(sending())
        consumer = asyncio.create_task(receiving())
        await asyncio.gather(producer, consumer)
    finally:
        log.info("Пользователь %s отключился :(", user)


# Шаг 4.
# TODO(2): Упражнение.
# Реализуйте логику широковещательной отправки сообщений всем подключенным пользователям.
# Подсказка: заведите множество очередей сообщений всех пользователей.

def main():
    app.config.from_mapping(DEBUG=True, ENV="dev")
    app.run()


if __name__ == "__main__":
    main()