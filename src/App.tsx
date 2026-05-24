/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { MusicProvider } from './context/MusicContext';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MusicProvider>
          <RouterProvider router={router} />
        </MusicProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

