from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math, subprocess, json, concurrent.futures
ROOT=Path(__file__).resolve().parent; A=ROOT/'assets'; O=ROOT/'output';O.mkdir(exist_ok=True)
W,H,FPS=1920,1080,24
CREAM='#F8F1E6';BURG='#75243C';INK='#302529';MUTED='#69585B';GOLD='#D7AE70'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(n,b=False):return ImageFont.truetype(BOLD if b else FONT,n)
def wrap(text,ft,width):
 lines=[]
 for paragraph in text.split('\n'):
  line=''
  for word in paragraph.split():
   test=(line+' '+word).strip()
   if ft.getlength(test)>width and line:lines.append(line);line=word
   else:line=test
  lines.append(line)
 return lines
# Each scene: heading, explanation, screenshot (or evidence card), badge, card lines.
SAMPLE='EDITED SAMPLE TOUR · NO NEW AI CALL'
REC='RECORDED GROQ RUN · 24 OCT 2026'
STORIES=[
('01-notes-to-pack',[
('One note.\nFour useful drafts.','Less copying. More room for the event.', 'home',SAMPLE,[]),
('Give the brief\nsome space.','Write the date, place, duties and known prices on a full Notes page.','notes',SAMPLE,[]),
('Choose your\nAI provider.','Gemma via Google or GPT-OSS via Groq. Optional fallback needs permission for both.','models',SAMPLE,[]),
('A proper\ninvitation.','Apply a formal or informal letter. Add only the contact details you actually know.','invitation',SAMPLE,[]),
('A schedule\nyou can edit.','Keep the supplied durations. Later proposed timings stay labelled Suggested.','schedule',SAMPLE,[]),
('Turn gaps into\nreview items.','Unknown task owners and dates stay blank and block approval until resolved.','checklist',SAMPLE,[]),
('Costs that\nadd up.','50 × NGN 300 + 50 × NGN 100 = NGN 20,000. A NGN 30,000 limit leaves NGN 10,000.','budget',SAMPLE,[]),
('Your event.\nYour final say.','Review every section. Save a named pack in this browser, then export a backup.',None,'FLOW POINT · PAUL AYOADE DAVID',['Try the labelled sample','flowpoint.phoenixreborn.tech','No account required'])]),
('02-update-and-review',[
('One change.\nCheck the ripple.','A recorded update shows why review matters as much as generation.',None,REC,['Willow Skills Exchange','GPT-OSS 120B via Groq','Recorded evidence, not a new request']),
('Change the\nresponsible person.','The update replaced Lara Chen with Nora Cole for the practical session.',None,REC,['Before: Lara Chen','After: Nora Cole','Keep unrelated duties intact']),
('Change the\nquantities.','Eight kits became ten, each still CAD 12.50. Room hire changed from zero to CAD 90.',None,REC,['10 kits × CAD 12.50 = CAD 125','Room hire = CAD 90','Updated known cost = CAD 215']),
('Catch the\noverspend.','The spending limit stayed CAD 200. The updated budget exceeded it by CAD 15.',None,REC,['Known total: CAD 215','Spending limit: CAD 200','Approval blocked: CAD 15 over budget']),
('Check the fact.\nSee its source.','The current workspace gives facts Source cards. Missing evidence needs manual review.','sources',SAMPLE,[]),
('Keep the\nprevious draft.','Completed steps have browser checkpoints. A failed replacement must not erase the saved pack.',None,'CURRENT IMPLEMENTATION · SOFTWARE TESTED',['Facts → Invitation → Run of show','Reuse completed steps on identical retry','Compare and restore previous wording']),
('Know who\nprocessed it.','Receipts identify each provider and model. Optional fallback does not bypass content checks.',None,'CURRENT IMPLEMENTATION · SOFTWARE TESTED',['Provider and model per step','Separate server-side keys','No fabricated output after failure']),
('AI drafts.\nYou decide.','The Willow Prepare and Update passed their 54 declared checks combined. One case is not an accuracy rate.',None,REC,['Source: quality-v4 evidence','Review wording, sources and budget','github.com/PHONIEXz/flow-point'])]),
('03-pdfs-and-build',[
('Useful work\nshould leave\nthe browser.','Download the invitation, run of show, checklist or budget as its own PDF.','download',SAMPLE,[]),
('A letter you\ncan read.','This is an actual PDF exported by the app from the fictional Cedar demo.', 'pdf','LOCAL APP EXPORT · FICTIONAL DRAFT',[]),
('A filename\nthat makes sense.','Each PDF starts with the event title, then its document name and a unique suffix.',None,'CURRENT IMPLEMENTATION · SOFTWARE TESTED',['Cedar School Reading Day','Invitation / Run of show / Budget','Unique timestamp and suffix']),
('Render keeps\nthe app running.','A Node web service serves the workspace, protects API keys and produces exports.',None,'VERIFIED DEPLOYMENT RECORD · 25 OCT 2026',['Render web service: flow-point-app','Release: 02005ef7','Health endpoint: /healthz']),
('Two models.\nClear roles.','Open-weight Gemma and GPT-OSS interpret notes and propose wording. Humans review the result.',None,'HOSTED INFERENCE · NOT OFFLINE',['Google → Gemma','Groq → GPT-OSS','Quota and provider errors remain possible']),
('A public home.\nOpen source.','The .tech address gives judges a direct route to the app. GitHub holds the MIT-licensed source.', 'home-dark','ACTUAL UI CAPTURE',['flowpoint.phoenixreborn.tech','github.com/PHONIEXz/flow-point']),
('Copilot helped\nreview a real fix.','Copilot Chat inspected PDF filenames in PR #1. Its findings were evaluated and regression-tested.',None,'DOCUMENTED COPILOT CHAT CONTRIBUTION',['Malformed Unicode handling','Safe decoded download names','See docs/copilot-review.md']),
('Built to\nbe checked.','145 passing software tests cover app behavior. They do not measure general AI accuracy.',None,'SOFTWARE CHECKS · NOT AN ACCURACY RATE',['Node.js: server','PDFKit: document output','Browser storage: saved packs']),
('Make room\nfor the event.','Try Flow Point. Read the evidence, edit a sample and open its PDF.',None,'FLOW POINT · PAUL AYOADE DAVID',['flowpoint.phoenixreborn.tech','github.com/PHONIEXz/flow-point','Review before sharing'])])]
IMAGES={}
for p in A.glob('*.png'):
 im=Image.open(p).convert('RGB')
 # Crop the actual pack column; preserve controls and real text, never redraw UI.
 if p.stem in ['invitation','download','schedule','budget']:im=im.crop((365,0,1315,min(810,im.height)))
 if p.stem=='pdf':im=im.crop((70,105,1080,850))
 IMAGES[p.stem]=im

def frame(story,idx,t):
 heading,body,asset,badge,items=story[idx];im=Image.new('RGB',(W,H),CREAM);d=ImageDraw.Draw(im)
 d.ellipse((1330+30*math.sin(t),-330,2310,650),fill='#EDDFC9');d.ellipse((-340,800,380,1510),fill='#EDDDE0')
 d.rounded_rectangle((70,58,290,112),radius=20,fill=BURG);d.text((91,68),'FLOW POINT',font=font(24,True),fill=CREAM)
 d.text((330,70),f'{idx+1:02d} / {len(story):02d}',font=font(23),fill=MUTED)
 d.text((70,160),badge,font=font(20,True),fill=BURG)
 progress=min(1,t/.65);ease=1-(1-progress)**3; x=70-int((1-ease)*45)
 lines=wrap(heading,font(61,True),550);y=255
 for line in lines:d.text((x,y),line,font=font(61,True),fill=INK);y+=76
 y+=36
 for line in wrap(body,font(29),525):d.text((x,y),line,font=font(29),fill=MUTED);y+=43
 d.rectangle((70,1001,1850,1006),fill='#DECFBD');d.rectangle((70,1001,70+int(1780*(idx+t/6)/len(story)),1006),fill=BURG)
 d.text((70,1030),'flowpoint.phoenixreborn.tech',font=font(22,True),fill=BURG);d.text((1400,1030),'Paul Ayoade David',font=font(22),fill=MUTED)
 if asset and asset in IMAGES:
  src=IMAGES[asset];size=(1165,760);scale=min(size[0]/src.width,size[1]/src.height)
  # Gentle motion through actual captured UI, labelled as edited footage.
  zoom=1+0.018*min(t/6,1);sw,sh=int(src.width*scale*zoom),int(src.height*scale*zoom)
  pic=src.resize((sw,sh),Image.Resampling.LANCZOS);px=650+(1165-sw)//2;py=210+(760-sh)//2
  d.rounded_rectangle((px-15,py-15,px+sw+15,py+sh+15),radius=23,fill='#DCCCBD');im.paste(pic,(px,py));d=ImageDraw.Draw(im)
  # Editorial cursor cue follows the real captured controls; not an unrecorded click.
  cx=int(px+sw*(.5+.24*math.sin(min(t/4,1)*1.7)));cy=int(py+sh*(.55+.17*math.sin(t*.5)))
  d.polygon([(cx,cy),(cx+10,cy+39),(cx+19,cy+28),(cx+36,cy+28)],fill=BURG,outline='white',width=3)
  if 3<t<3.8:
   radius=int(16+38*(t-3));d.ellipse((cx-radius,cy-radius,cx+radius,cy+radius),outline=BURG,width=3)
 else:
  d.rounded_rectangle((650,225,1840,900),radius=38,fill=BURG)
  d.text((710,280),'FLOW POINT / EVIDENCE',font=font(23,True),fill='#E9CB97')
  yy=390
  for n,item in enumerate(items):
   for line in wrap(item,font(40 if len(item)<47 else 31,True),1060):d.text((715,yy),line,font=font(40 if len(item)<47 else 31,True),fill=CREAM);yy+=59
   yy+=38
 # Short cream flash at scene entry, smooth without obscuring the main content.
 if t<.18:im=Image.blend(Image.new('RGB',(W,H),CREAM),im,t/.18)
 return im

def render(index):
 name,story=STORIES[index];tmp=O/(name+'-silent.mp4');final=O/(name+'.mp4')
 cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','19','-threads','2','-pix_fmt','yuv420p',str(tmp)]
 process=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for idx in range(len(story)):
  for k in range(6*FPS):
   img=frame(story,idx,k/FPS);process.stdin.write(img.tobytes())
   if k==FPS*2:img.resize((960,540)).save(O/f'{name}-scene-{idx+1:02d}.jpg',quality=88)
 process.stdin.close()
 if process.wait():raise RuntimeError('ffmpeg rendering failed')
 duration=len(story)*6;music=ROOT.parent/'flow-point-motion-v2/original-background.wav'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(tmp),'-ss',str(index*35),'-stream_loop','-1','-i',str(music),'-t',str(duration),'-map','0:v','-map','1:a','-c:v','copy','-af',f'loudnorm=I=-21:TP=-2:LRA=9,afade=t=in:d=0.8,afade=t=out:st={duration-1.5}:d=1.5','-c:a','aac','-b:a','160k','-movflags','+faststart',str(final)],check=True)
 tmp.unlink()
 def stamp(sec):return f'{int(sec//3600):02d}:{int(sec//60%60):02d}:{int(sec%60):02d},000'
 (O/(name+'.srt')).write_text('\n\n'.join(f'{i+1}\n{stamp(i*6)} --> {stamp((i+1)*6)}\n{h.replace(chr(10)," ")}\n{b}' for i,(h,b,*_) in enumerate(story))+'\n')
 print(json.dumps({'video':name,'seconds':duration,'path':str(final)}),flush=True)
 return str(final)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:list(ex.map(render,range(3)))
