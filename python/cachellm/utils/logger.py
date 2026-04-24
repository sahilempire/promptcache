import logging

_logger = logging.getLogger("cachellm")

PREFIX = "[cachellm]"


class Logger:
    def __init__(self, enabled: bool = False):
        self._enabled = enabled

    def debug(self, *args: object) -> None:
        if self._enabled:
            print(PREFIX, *args)

    def info(self, *args: object) -> None:
        if self._enabled:
            print(PREFIX, *args)

    def warn(self, *args: object) -> None:
        print(PREFIX, *args)


def create_logger(enabled: bool = False) -> Logger:
    return Logger(enabled)
