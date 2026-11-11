import { Controls } from './components/Controls.tsx'
import { PrintRequest } from './components/PrintRequest.tsx'
import { Sidebar } from './components/Sidebar.tsx'
import { Viewer } from './components/Viewer.tsx'
import { CONTACT_EMAIL, MAIN_SITE_URL, SITE_URL } from './config.ts'
import data from './data/collections.json'
import { formatHash } from './route.ts'
import type { Collection } from './types.ts'
import { useGallery } from './useGallery.ts'
import './styles.css'

export default function App({ collections = data as Collection[] }: { collections?: Collection[] }) {
  const g = useGallery(collections)
  return (
    <div className="layout">
      <Sidebar collections={collections} current={g.c} onPick={g.pickCollection} />
      <main className="main">
        <Viewer collection={g.collection} photo={g.photo} gridOpen={g.gridOpen} onNext={g.next} onOpen={g.goTo} />
        <Controls
          collectionName={g.collection.name}
          caption={g.photo.caption}
          index={g.i}
          total={g.collection.photos.length}
          gridOpen={g.gridOpen}
          onPrev={g.prev}
          onNext={g.next}
          onToggleGrid={g.toggleGrid}
        />
        <PrintRequest
          collectionName={g.collection.name}
          photoNumber={g.i + 1}
          photoUrl={SITE_URL + '/' + formatHash(collections, g.c, g.i)}
        />
        <footer id="info" className="footer">
          <span>San Francisco</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <a href={MAIN_SITE_URL}>zhoucai.me</a>
        </footer>
      </main>
    </div>
  )
}
