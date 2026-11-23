# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "trimesh==5.2.2"]
# ///
"""Convert a released device GLB (meters, +Y up) to a drawing GLB (mm, +Z up)."""

import argparse
from pathlib import Path

import numpy as np
import trimesh


def prepare_model(source: Path, output: Path) -> None:
    scene = trimesh.load_scene(source, process=False)
    parts = []
    for node in scene.graph.nodes_geometry:
        transform, key = scene.graph[node]
        geometry = scene.geometry[key]
        part = trimesh.Trimesh(geometry.vertices, geometry.faces, process=False)
        part.apply_transform(transform)
        parts.append(part)

    mesh = trimesh.util.concatenate(parts)
    # The drawing loader expects CAD coordinates (+Z up). The source is +Y up.
    vertices = (mesh.vertices[:, [0, 2, 1]] * 1000).astype(np.float32)
    vertices[:, 1] *= -1
    # Compact duplicate positions without collapsing any triangle edges.
    vertices, inverse = np.unique(vertices, axis=0, return_inverse=True)
    outline = trimesh.Trimesh(vertices, inverse.reshape(-1)[mesh.faces], process=False)
    outline.export(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    prepare_model(args.source, args.output)
