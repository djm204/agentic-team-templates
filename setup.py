"""Build step: copy repo root templates/ into the package so they are included in the wheel/sdist."""
from pathlib import Path
import shutil

from setuptools import setup
from setuptools.command.build_py import build_py


class BuildPy(build_py):
    def run(self):
        pkg_dir = Path(__file__).parent / "agentic_team_templates"
        templates_src = Path(__file__).parent / "templates"
        templates_dst = pkg_dir / "templates"
        if templates_src.is_dir():
            if templates_dst.exists():
                shutil.rmtree(templates_dst)
            shutil.copytree(templates_src, templates_dst)
        super().run(self)


setup(cmdclass={"build_py": BuildPy})
