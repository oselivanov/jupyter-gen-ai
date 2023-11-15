"""Package Setup."""

__author__ = 'Oleg Selivanov'

from setuptools import find_packages, setup

setup(
    name='jupyter-gen-ai',
    version='0.1.0',
    packages=find_packages(),
    include_package_data=True,
    description='Jupyter GenAI',
    long_description='',
    # license=__copyright__,
    url='https://github.com/oselivanov/jupyter-gen-ai',
    author=__author__,
    author_email='oleg.a.selivanov@gmail.com',
    classifiers=[
        'Intended Audience :: Developers',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
    ],
    install_requires=[
        'notebook >= 5.0.0, < 6.0.0',
    ],
)
