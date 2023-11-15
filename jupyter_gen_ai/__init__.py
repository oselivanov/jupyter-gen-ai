"""Helper functions for Jupyter GenAI."""

__author__ = 'Oleg Selivanov <oleg.a.selivanov@gmail.com>'


def _jupyter_nbextension_paths():
    return [
        dict(section='notebook',
             src='static',
             dest='jupyter_gen_ai/static',
             require='jupyter_gen_ai/static/main')
    ]
