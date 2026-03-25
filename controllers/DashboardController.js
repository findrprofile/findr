import { fb } from '../services/FirebaseService.js';

export class DashboardController {
    constructor() {
        this.listContainer = document.getElementById('dashboard-users-list');
        this.mainTitle = document.getElementById('dash-main-title');
        this.heroCard = document.getElementById('dash-hero-card');
        this.heroImg = document.getElementById('dash-hero-img');
        this.subtitle = document.getElementById('dash-subtitle');
        this.buildingCodeSpan = document.getElementById('dash-building-code');
        
        this.unsubscribe = null;
        this.currentLocationState = "Searching"; 

        // 1. UTM Geofence Data
        this.CAMPUS_CENTER = { lat: 43.5480, lng: -79.6625, radius: 1000 }; // 1km covers the whole campus
        
        this.BUILDINGS = [
            { id: "MN", code: "MN", name: "Maanjiwe Nendamowinan", lat: 43.5528, lng: -79.6624, radius: 45, img: "artwork/mn-building.jpg" },
            { id: "IB", code: "IB", name: "Instructional Centre", lat: 43.5535, lng: -79.6628, radius: 45, img: "artwork/ib-building.jpg" },
            { id: "CC", code: "CC", name: "Communication Culture & Technology", lat: 43.5515, lng: -79.6635, radius: 50, img: "artwork/cc-building.jpg" },
            { id: "DV", code: "DV", name: "The William G. Davis Building", lat: 43.5492, lng: -79.6628, radius: 120, img: "artwork/dv-building.jpg" },
            { id: "KN", code: "KN", name: "The Kaneff Centre", lat: 43.5518, lng: -79.6655, radius: 45, img: "artwork/kn-building.jpg" },
            { id: "HB", code: "HB", name: "Terrence Donnelly Health Sciences", lat: 43.5510, lng: -79.6668, radius: 45, img: "artwork/hb-building.jpg" },
            { id: "LIB", code: "Library", name: "U of T Mississauga Library", lat: 43.5505, lng: -79.6645, radius: 40, img: "artwork/lib-building.jpg" },
            { id: "DH", code: "DH", name: "Deerfield Hall", lat: 43.5538, lng: -79.6618, radius: 40, img: "artwork/dh-building.jpg" },
            { id: "SCI", code: "Science", name: "The Science Building", lat: 43.5485, lng: -79.6650, radius: 50, img: "artwork/sci-building.jpg" }
        ];
    }

    start() {
        this.locateUser();
    }

    // --- GEOLOCATION LOGIC ---

    locateUser() {
        if (!navigator.geolocation) {
            this.setUIState("Off Campus");
            return;
        }

        // Ask the device for GPS coordinates
        this.watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const myLat = position.coords.latitude;
                const myLng = position.coords.longitude;
                
                const detectedBuilding = this.findMyBuilding(myLat, myLng);
                const isOnCampus = this.calculateDistance(myLat, myLng, this.CAMPUS_CENTER.lat, this.CAMPUS_CENTER.lng) <= this.CAMPUS_CENTER.radius;

                if (detectedBuilding) {
                    this.currentLocationState = detectedBuilding;
                } else if (isOnCampus) {
                    this.currentLocationState = "Campus Grounds";
                } else {
                    this.currentLocationState = "Off Campus";
                }

                // Save this new location to Firebase so others can see where you are!
                if (fb.userModel && detectedBuilding) {
                    fb.userModel.lastLocation = detectedBuilding.code;
                    await fb.saveMyProfile();
                }

                this.setUIState(this.currentLocationState);
            },
            (error) => {
                console.error("GPS Error:", error);
                this.setUIState("Off Campus"); // Default to off-campus if they deny GPS permissions
            },
            { enableHighAccuracy: true }
        );
    }

    findMyBuilding(lat, lng) {
        for (const building of this.BUILDINGS) {
            const distanceInMeters = this.calculateDistance(lat, lng, building.lat, building.lng);
            if (distanceInMeters <= building.radius) {
                return building; 
            }
        }
        return null;
    }

    // The Haversine Formula: Calculates the distance between two GPS coordinates in meters
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // --- UI & FIREBASE RENDER LOGIC ---

    setUIState(locationData) {
        if (locationData === "Off Campus") {
            this.mainTitle.innerHTML = "You are currently off campus.";
            this.heroCard.style.display = "none";
            this.subtitle.style.display = "none";
            this.listContainer.innerHTML = '';
            if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }

        } else if (locationData === "Campus Grounds") {
            this.mainTitle.innerHTML = "Welcome to the<br><span style='font-weight: 800'>University of Toronto Mississauga!</span>";
            this.heroCard.style.display = "block";
            this.heroImg.src = "artwork/campus-general.jpg"; // Fallback image for general campus
            this.subtitle.style.display = "none";
            this.listContainer.innerHTML = '';
            if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }

        } else {
            // THEY ARE IN A BUILDING!
            this.mainTitle.innerHTML = `Welcome to<br><span style="font-weight: 800">${locationData.code}</span> (${locationData.name})`;
            this.heroCard.style.display = "block";
            this.heroImg.src = locationData.img;
            
            this.subtitle.style.display = "block";
            this.buildingCodeSpan.textContent = locationData.code;

            // Turn on the Firebase listener ONLY for people in this specific building
            if (!this.unsubscribe) {
                this.unsubscribe = fb.listenToAllUsers((users) => {
                    // Filter the database so it ONLY shows users matching this building code
                    const peopleInMyBuilding = users.filter(u => u.lastLocation === locationData.code);
                    this.renderList(peopleInMyBuilding);
                });
            }
        }
    }

    renderList(users) {
        this.listContainer.innerHTML = '';
        if (users.length === 0) {
            this.listContainer.innerHTML = '<p style="color:var(--text-secondary); text-align: center; margin-top: 20px;">No one else is here right now.</p>';
            return;
        }

        users.forEach(u => {
            const card = document.createElement('div');
            card.className = 'user-card'; // Re-using your exact CSS
            
            let badgesHTML = '';
            const renderBadges = (arr, colorClass) => { arr.forEach(tag => badgesHTML += `<span class="badge ${colorClass}">${tag}</span>`); };
            renderBadges(u.tags.interests, 'orange');
            renderBadges(u.tags.skills, 'blue');
            renderBadges(u.tags.hangouts, 'purple');

            const isFriend = fb.userModel.friendsList.includes(u.uid);
            const isPending = fb.userModel.outgoingRequests.includes(u.uid);

            let actionButtonHTML = '';
            if (isFriend) { actionButtonHTML = `<span style="font-size: 12px; color: var(--primary-teal); font-weight: 700;">Friends</span>`; } 
            else if (isPending) { actionButtonHTML = `<button disabled style="background:#e0f7fa; color:var(--bg-dark); border:none; padding:6px 15px; border-radius:20px; font-weight:700; font-size:12px;">Sent ✓</button>`; } 
            else { actionButtonHTML = `<button class="btn-add" style="background:var(--primary-teal); color:var(--bg-dark); border:none; padding:6px 15px; border-radius:20px; font-weight:700; font-size:12px; cursor:pointer;">Add +</button>`; }

            card.innerHTML = `
                <div class="uc-header">
                    <div class="uc-profile-info">
                        <img src="${u.avatar || 'artwork/Default_Profile_Icon.png'}" class="uc-avatar" alt="${u.name}'s avatar">
                        <div><div class="uc-name">${u.name}</div></div>
                    </div>
                    <div class="uc-actions">${actionButtonHTML}</div>
                </div>
                <div class="badges-scroll">${badgesHTML || '<span style="font-size:11px;color:#888;">No badges yet</span>'}</div>
            `;

            const addBtn = card.querySelector('.btn-add');
            if (addBtn) addBtn.addEventListener('click', (e) => this.addFriend(u.uid, e.target));
            this.listContainer.appendChild(card);
        });
    }

    async addFriend(friendUid, btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = 'Sending...';
        await fb.sendFriendRequest(friendUid);
    }
}