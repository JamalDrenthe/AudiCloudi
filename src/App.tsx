import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { TrackProvider } from '@/context/TrackContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { TrackDetail } from '@/pages/TrackDetail';
import { PlaylistDetail } from '@/pages/PlaylistDetail';
import { UserProfile } from '@/pages/UserProfile';
import { Upload } from '@/pages/Upload';
import { Search } from '@/pages/Search';
import { Library } from '@/pages/Library';
import { Admin } from '@/pages/Admin';
import { Pricing } from '@/pages/Pricing';
import { Charts } from '@/pages/Charts';
import { Artists } from '@/pages/Artists';

function App() {
  return (
    <AuthProvider>
      <TrackProvider>
        <PlaylistProvider>
          <PlayerProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/roster" element={<Artists />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/track/:id" element={<TrackDetail />} />
                <Route path="/playlist/:id" element={<PlaylistDetail />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="/artist/:id" element={<UserProfile />} />
                <Route path="/label/:id" element={<UserProfile />} />
                <Route path="/zheavenzy" element={<Navigate to="/label/zheavenzy" replace />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/admin" element={<Admin />} />
                {/* Catch all - redirect to home */}
                <Route path="*" element={<Home />} />
              </Routes>
            </BrowserRouter>
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                style: {
                  background: '#141414',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                },
              }}
            />
          </PlayerProvider>
        </PlaylistProvider>
      </TrackProvider>
    </AuthProvider>
  );
}

export default App;
