import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

/**
 * Charge la page affichée.
 *
 * La fusion base + JSON est faite par le serveur : un seul appel
 * suffit, et le frontend n'a plus à recoller deux paginations.
 */
export function useEtudiants(filtres) {
    const [etat, setEtat] = useState({
        etudiants: [], total: 0, totalPages: 1, chargement: true, erreur: null
    });
    const requete = useRef(0);

    const charger = useCallback(async () => {
        const jeton = ++requete.current;
        setEtat((e) => ({ ...e, chargement: true, erreur: null }));

        try {
            const params = {
                page:   filtres.page,
                limite: filtres.limite,
                source: filtres.source
            };
            if (filtres.recherche) params.recherche = filtres.recherche;
            if (filtres.classe)    params.classe    = filtres.classe;
            if (filtres.archive)   params.archive   = 'true';
            if (filtres.validite)  params.valide    = filtres.validite;

            const reponse = await api.etudiants(params);

            if (jeton !== requete.current) return; // réponse périmée
            setEtat({
                etudiants:  reponse.data,
                total:      reponse.pagination.total,
                totalPages: reponse.pagination.total_pages,
                chargement: false,
                erreur:     null
            });
        } catch (e) {
            if (jeton !== requete.current) return;
            setEtat({
                etudiants: [], total: 0, totalPages: 1,
                chargement: false, erreur: e.message
            });
        }
    }, [filtres]);

    useEffect(() => {
        charger();
    }, [charger]);

    return { ...etat, recharger: charger };
}
