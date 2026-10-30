import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Player, Relationship, ParentKeyPicker, PracticeWorkspace, type WorkspaceProps } from './index';
describe('controlled UI semantics', () => {
 it('exposes retry and interruption details without starting audio', () => { const play=vi.fn(); const html=renderToStaticMarkup(<Player chord="Fmaj7#5" modeName="F Lydian augmented" status={{state:'error',message:'Interrupted'}} onPlay={play} onStop={()=>{}} preset="Warm" presets={[{value:'Warm',label:'Warm'}]} onPreset={()=>{}} volume={0.3} onVolume={()=>{}}/>); expect(html).toContain('Retry'); expect(html).toContain('Interrupted'); expect(play).not.toHaveBeenCalled(); });
 it('retains overlapping tonic, chord, and distinctive text', () => { const html=renderToStaticMarkup(<Relationship chord="Fmaj7#5" chordSpelling="F A C# E" parentNotes="D E F G A B C#" modeName="F Lydian augmented" notes={[{name:'C#',interval:'#5',tonic:true,chordTone:true,distinctiveRole:'#5'}]}/>); expect(html).toContain('C#, #5, Tonic, Chord tone, Characteristic'); expect(html).toContain('Chord tone'); expect(html).toContain('#5'); });
 it('starts with an accessible closed parent selector', () => { const html=renderToStaticMarkup(<ParentKeyPicker parent="D" family="jazz-melodic-minor" pairs={[]} onSelect={()=>{}}/>); expect(html).toContain('aria-label="Parent tonic D"'); expect(html).toContain('aria-expanded="false"'); expect(html).toContain('aria-controls="pp-circle"'); });
});

it('renders controlled shape buttons and guided configuration only', () => {
 const props = { workflow:'guided', parent:'D', family:'major', keyPairs:[], modes:[], degree:1, positions:['C','A','G','E','D'].map(value=>({value,label:`${value} shape (unreviewed)`})), position:'A', view:'diagram', notes:[], candidates:[], presets:[], status:{state:'stopped'}, configuration:<div>Configuration slot</div> } as unknown as WorkspaceProps;
 const html=renderToStaticMarkup(<PracticeWorkspace {...props}/>);
 expect(html).toContain('aria-label="A shape (unreviewed)" aria-pressed="true"');
 expect(html).toContain('aria-label="C shape (unreviewed)" aria-pressed="false"');
 expect(html.indexOf('Configuration slot')).toBeGreaterThan(html.indexOf('Guitar'));
 expect(html).not.toContain('Self-guided'); expect(html).not.toContain('Practice workspace');
 expect(html.indexOf('Guitar')).toBeLessThan(html.indexOf('Mode notation'));
});

it('renders seven evenly addressable notes with non-color role labels', () => {
 const notes = ['C','D','E','F','G','A','B'].map((name, i) => ({name, interval:String(i + 1), tonic:i === 0, chordTone:i % 2 === 0, distinctiveRole:i === 3 ? 'Distinctive 4' : undefined}));
 const html = renderToStaticMarkup(<Relationship chord="C" chordSpelling="" parentNotes="" modeName="" notes={notes}/>);
 expect((html.match(/<li /g) ?? [])).toHaveLength(7);
 expect(html).toContain('C, 1, Tonic, Chord tone');
 expect(html).toContain('F, 4, Characteristic');
 expect(html).toContain('◎ Tonic'); expect(html).toContain('★ Characteristic');
});
