import io, sys, tempfile, unittest, zipfile
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/"scripts"))
from ingest_validation_zip import ingest

def png(alpha=255, color=(200,80,20)):
    b=io.BytesIO(); im=Image.new("RGBA",(24,24),(0,0,0,0))
    if alpha: im.paste((*color,alpha),(6,6,18,18))
    im.save(b,"PNG"); return b.getvalue()

def archive(path, entries):
    with zipfile.ZipFile(path,"w") as z:
        for name,data in entries: z.writestr(name,data)

class IngestTests(unittest.TestCase):
    def run_ingest(self, entries):
        td=tempfile.TemporaryDirectory(); root=Path(td.name); z=root/"x.zip"; archive(z,entries)
        out=root/"assets/validation-candidates/ingest-x"; report=root/"report.json"
        result=ingest(z,out,report); return td,root,out,result

    def test_valid_recursive_alpha_and_non_png(self):
        td,root,out,r=self.run_ingest([("a.png",png()),("nested/b.png",png(color=(10,200,30))),("note.txt",b"x")]); self.addCleanup(td.cleanup)
        self.assertEqual(r["png_valid"],2); self.assertEqual(r["rejected"],1)
        for p in out.glob("*.png"):
            with Image.open(p) as im:
                self.assertEqual(im.mode,"RGBA"); self.assertIsNotNone(im.getchannel("A").getbbox())

    def test_traversal_corrupt_transparent_collision_and_duplicate(self):
        t=io.BytesIO(); Image.new("RGBA",(8,8),(0,0,0,0)).save(t,"PNG"); good=png()
        td,root,out,r=self.run_ingest([("../evil.png",good),("bad.png",b"bad"),("transparent.png",t.getvalue()),
          ("x/same.png",good),("y/same.png",png(color=(1,2,3))),("copy.png",good)]); self.addCleanup(td.cleanup)
        reasons={x["reason"] for x in r["rejections"]}
        self.assertTrue({"unsafe_path","corrupt_png","fully_transparent","name_collision","binary_duplicate"} <= reasons)
        self.assertFalse((root/"evil.png").exists())

    def test_count_not_limited_to_20(self):
        entries=[(f"p{i:03}.png",png(color=(i%250,(i*3)%250,(i*7)%250))) for i in range(25)]
        td,root,out,r=self.run_ingest(entries); self.addCleanup(td.cleanup)
        self.assertEqual(r["png_valid"],25); self.assertEqual(len(list(out.glob("*.png"))),25)

    def test_existing_destination_never_overwritten(self):
        td=tempfile.TemporaryDirectory(); self.addCleanup(td.cleanup); root=Path(td.name)
        z=root/"x.zip"; archive(z,[("a.png",png())]); out=root/"assets/validation-candidates/ingest-x"
        out.mkdir(parents=True); (out/"a.png").write_bytes(b"keep")
        with self.assertRaises(FileExistsError): ingest(z,out,root/"r.json")
        self.assertEqual((out/"a.png").read_bytes(),b"keep")
if __name__=="__main__": unittest.main()
