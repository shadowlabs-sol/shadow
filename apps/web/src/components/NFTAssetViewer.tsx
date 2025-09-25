'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Video, 
  Music, 
  FileText, 
  Download, 
  ExternalLink, 
  Eye, 
  X,
  Loader2,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  fetchMetadata,
  findMetadataPda,
  deserializeMetadata 
} from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { Connection } from '@solana/web3.js';

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
  };
}

interface NFTAssetViewerProps {
  mintAddress?: string;
  metadata?: NFTMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export const NFTAssetViewer: React.FC<NFTAssetViewerProps> = ({
  mintAddress,
  metadata: providedMetadata,
  isOpen,
  onClose
}) => {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(providedMetadata || null);
  const [loading, setLoading] = useState(!providedMetadata);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!providedMetadata && mintAddress && isOpen) {
      fetchNFTMetadata();
    }
  }, [mintAddress, isOpen, providedMetadata]);

  const fetchNFTMetadata = async () => {
    if (!mintAddress) return;

    setLoading(true);
    setError(null);

    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com');
      const umi = createUmi(connection);
      
      const mintPublicKey = publicKey(mintAddress);
      const metadataPda = findMetadataPda(umi, { mint: mintPublicKey });
      
      const metadataAccount = await fetchMetadata(umi, metadataPda);
      
      if (!metadataAccount) {
        throw new Error('No metadata found for this token');
      }

      let externalMetadata: any = {};
      
      if (metadataAccount.uri) {
        try {
          const response = await fetch(metadataAccount.uri);
          if (response.ok) {
            externalMetadata = await response.json();
          }
        } catch (fetchError) {
          console.warn('Failed to fetch external metadata:', fetchError);
        }
      }

      const metadata: NFTMetadata = {
        name: metadataAccount.name || externalMetadata.name || `Token ${mintAddress.slice(0, 8)}...`,
        description: externalMetadata.description || 'NFT from Solana blockchain',
        image: externalMetadata.image,
        animation_url: externalMetadata.animation_url,
        external_url: externalMetadata.external_url,
        attributes: externalMetadata.attributes || [
          { trait_type: "Mint Address", value: mintAddress },
          { trait_type: "Symbol", value: metadataAccount.symbol || 'Unknown' },
          { trait_type: "Update Authority", value: metadataAccount.updateAuthority.toString() }
        ],
        properties: externalMetadata.properties
      };

      setMetadata(metadata);
    } catch (err) {
      setError("Failed to load NFT metadata");
      console.error("Error fetching NFT metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension || '')) return 'audio';
    return 'unknown';
  };

  const renderMedia = () => {
    if (!metadata) return null;

    const primaryMedia = metadata.animation_url || metadata.image;
    if (!primaryMedia) return null;

    const fileType = getFileType(primaryMedia);

    switch (fileType) {
      case 'image':
        return (
          <div className="relative">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            )}
            <img
              src={primaryMedia}
              alt={metadata.name || 'NFT'}
              className="w-full h-auto max-h-96 object-contain rounded-lg"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setError("Failed to load image");
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video
              src={primaryMedia}
              className="w-full h-auto max-h-96 rounded-lg"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-8 text-center">
            <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">Audio NFT</p>
            <audio src={primaryMedia} controls className="w-full" />
          </div>
        );

      default:
        return (
          <div className="bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-lg p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">Unknown file type</p>
            <a
              href={primaryMedia}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-black/95 backdrop-blur-xl rounded-2xl border border-white/[0.08]"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Eye className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">NFT Asset Viewer</h2>
                {mintAddress && (
                  <p className="text-xs text-gray-400 font-mono">
                    {mintAddress.slice(0, 8)}...{mintAddress.slice(-8)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg border border-white/[0.08] transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-400">Loading NFT metadata...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={fetchNFTMetadata}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : metadata ? (
              <div className="space-y-6">
                <div className="bg-black/20 rounded-lg p-4">
                  {renderMedia()}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {metadata.name || 'Untitled NFT'}
                    </h3>
                    {metadata.description && (
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {metadata.description}
                      </p>
                    )}
                  </div>

                  {metadata.attributes && metadata.attributes.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Attributes</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {metadata.attributes.map((attr, index) => (
                          <div
                            key={index}
                            className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]"
                          >
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                              {attr.trait_type}
                            </p>
                            <p className="text-sm font-semibold text-white">
                              {attr.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {metadata.external_url && (
                      <a
                        href={metadata.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg border border-purple-500/20 transition-all"
                        onClick={() => toast.success('Opening external link')}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View External
                      </a>
                    )}
                    {mintAddress && (
                      <a
                        href={`https://solscan.io/token/${mintAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/20 transition-all"
                        onClick={() => toast.success('Opening Solscan')}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Solscan
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No metadata available</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};