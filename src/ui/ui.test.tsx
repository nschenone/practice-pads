import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Player, Relationship, ParentKeyPicker } from './index';
describe('controlled UI semantics', () => {
 it('exposes retry and interruption details without starting audio', () => { const play=vi.fn(); const html=renderToStaticMarkup(<Player chord="Fmaj7#5" modeName="F Lydian augmented" status={{state:'error',message:'Interrupted'}} onPlay={play} onStop={()=>{}} preset="Warm" presets={[{value:'Warm',label:'Warm'}]} onPreset={()=>{}} volume={0.3} onVolume={()=>{}}/>); expect(html).toContain('Retry'); expect(html).toContain('Interrupted'); expect(play).not.toHaveBeenCalled(); });
 it('retains overlapping tonic, chord, and distinctive text', () => { const html=renderToStaticMarkup(<Relationship chord="Fmaj7#5" chordSpelling="F A C# E" parentNotes="D E F G A B C#" modeName="F Lydian augmented" notes={[{name:'C#',interval:'#5',tonic:true,chordTone:true,distinctiveRole:'#5'}]}/>); expect(html).toContain('tonic distinctive'); expect(html).toContain('Chord tone'); expect(html).toContain('#5'); });
 it('starts with an accessible closed parent selector', () => { const html=renderToStaticMarkup(<ParentKeyPicker parent="D" family="jazz-melodic-minor" pairs={[]} onSelect={()=>{}}/>); expect(html).toContain('aria-expanded="false"'); });
});
