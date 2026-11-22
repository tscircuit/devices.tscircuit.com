"""Render the USB-C speaker assembly from the tscircuit board and the Same Sky mechanical model.

Use the manufacturer STEP from https://www.sameskydevices.com/product/resource/3dmodel/cms-23558n-l152b.
Tessellate its solid, then truncate the abbreviated wire geometry with a plane at Y = 12.2 mm.
Blender 4.2, run in a directory containing speaker.glb (mm, tscircuit) and driver.stl
(mm, CMS-23558N-L152B with the vendor's shortened leads trimmed at Y = 12.2 mm).
"""
import bpy, math, os
from mathutils import Vector, Matrix
b=bpy
b.ops.wm.read_factory_settings(use_empty=True)
b.ops.import_scene.gltf(filepath=os.path.abspath('speaker.glb'))
for obj in list(b.context.scene.objects):
 if obj.parent is None: obj.matrix_world=Matrix.Rotation(math.pi,4,'Z')@obj.matrix_world
def material(name,rgb,rough=.5,metal=0):
 mat=b.data.materials.new(name);mat.diffuse_color=(*rgb,1);mat.use_nodes=True
 shader=mat.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*rgb,1);shader.inputs['Roughness'].default_value=rough;shader.inputs['Metallic'].default_value=metal;return mat
def block(name,center,size,mat):
 b.ops.mesh.primitive_cube_add(size=1,location=center);o=b.context.object;o.name=name;o.dimensions=size;b.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 bevel=o.modifiers.new('Rounded edges','BEVEL');bevel.width=.09;bevel.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o
steel=material('Stamped frame',(.40,.43,.46),.32,.75)
cone=material('PEI diaphragm',(.12,.135,.155),.29,.42)
back=material('Magnet',(.25,.27,.28),.55,.42)
ring=material('Surround',(.022,.025,.029),.45)
b.ops.wm.stl_import(filepath=os.path.abspath('driver.stl'));driver=b.context.object
driver.name='Same Sky CMS-23558N-L152B';driver.location=(43,1,-.75)
for m in (steel,cone,back,ring): driver.data.materials.append(m)
for f in driver.data.polygons:
 c=f.center;r=math.hypot(c.x,c.y)
 f.material_index=3 if r>10.6 else (0 if c.z<3.8 and r>8.3 else (2 if c.z<2.2 else 1))
ivory=material('JST housing',(.86,.84,.75),.46)
red=material('Red insulation',(.56,.014,.014),.40)
black=material('Black insulation',(.015,.017,.02),.43)
plug=(-4.8,11.1,5.1)
block('SHR-02V-S-B housing',plug,(2.87,1.70,2.40),ivory)
block('Plug key',(-4.8,11.89,5.15),(1.75,.38,1.40),ivory)
def wire(label,points,mat):
 c=b.data.curves.new(label,'CURVE');c.dimensions='3D';c.resolution_u=36;c.bevel_depth=.48;c.bevel_resolution=5
 s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for bp,pt in zip(s.bezier_points,points):
  bp.co=pt;bp.handle_left_type=bp.handle_right_type='AUTO'
 o=b.data.objects.new(label,c);b.context.collection.objects.link(o);o.data.materials.append(mat)
 return s
# The slack runs behind the board and driver. Keep both conductors continuous into J2.
for sign,mat in [(1,red),(-1,black)]:
 x=43+sign*1.9
 def path(depth):
  return [(-4.8+sign*.5,11.1,5.7),(-4.8+sign*.5,12.5,9.2),(-13+sign*.53,19,6.5),(-20+sign*.53,30,2.8),(-14,depth+sign*.55,1),(11,depth+3+sign*.55,1.1),(29,27+sign*.55,1.4),(47+sign*.53,26,1.25),(x,13.1,1.05),(x,12.3,1.05)]
 s=wire('Red speaker lead' if sign==1 else 'Black speaker lead',path(43),mat)
 lo,hi=33,65
 for _ in range(22):
  mid=(lo+hi)/2
  for point,co in zip(s.bezier_points,path(mid)):point.co=co
  if s.calc_length(resolution=32)>152:hi=mid
  else:lo=mid
 print('Lead centreline in mm',s.calc_length(resolution=32))
sc=b.context.scene
sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True
sc.render.threads_mode='FIXED';sc.render.threads=4
world=b.data.worlds.new('Studio');sc.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.87,.89,.94,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7
def light(name,loc,power,size,target):
 b.ops.object.light_add(type='AREA',location=loc);o=b.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
light('Softbox',(-35,-42,90),70000,75,(10,12,0));light('Rim',(52,56,60),50000,50,(26,10,0))
b.ops.mesh.primitive_plane_add(size=1800,location=(0,0,-.85));b.context.object.data.materials.append(material('Backdrop',(.79,.82,.88),.8))
target=Vector((14,21,1)); b.ops.object.camera_add(location=target+Vector((26,-92,103)));cam=b.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=105;cam.data.clip_end=1200;sc.camera=cam
sc.render.resolution_x=1200;sc.render.resolution_y=800;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG'
sc.render.filepath=os.path.abspath('speaker-assembly.png');b.ops.render.render(write_still=True)
