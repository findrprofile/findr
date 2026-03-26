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
            { 
                id: "MN", code: "MN", name: "(Maanjiwe Nendamowinan)", img: "artwork/MN.jpg",
                polygon: [
                    { lat: 43.55159177760383, lng: -79.66598598625467}, // Corner 1
                    { lat: 43.551369341617026, lng: -79.66525330972019}, // Corner 2
                    { lat: 43.550488312577116, lng: -79.66573323541756}, // Corner 3
                    { lat: 43.55074564417251, lng: -79.6665441443517}  // Corner 4 (Add more if the building isn't a simple square!)
                ] 
            },
            { 
                id: "IB", code: "IB", name: "(Instructional Centre)", img: "artwork/IB.jpg",
                polygon: [
                    { lat: 43.55106074979511, lng: -79.6634868293848},
                    { lat: 43.55157787955325, lng: -79.66468634004801},
                    { lat: 43.55197492973433, lng: -79.66437928299052},
                    { lat: 43.55151383896055, lng: -79.66317756328372}
                ] 
            },
            { 
                id: "CC", code: "CCT", name: "(Communication Culture & Technology)", img: "artwork/CC.jpg",
                polygon: [
                    { lat: 43.55057491247778, lng: -79.66307508099744},
                    { lat: 43.550227141189325, lng: -79.66314333377633},
                    { lat: 43.550182593621145, lng: -79.66285093478058},
                    { lat: 43.54982786496881, lng: -79.66256417393177},
                    { lat: 43.54954970622855, lng: -79.66261807634706},
                    { lat: 43.54954970622855, lng: -79.66261807634706},
                    { lat: 43.549380935136995, lng: -79.66332527603458},
                    { lat: 43.54921359929085, lng: -79.66338295208139},
                    { lat: 43.54923973778779, lng: -79.66351589028869},
                    { lat: 43.550606118280086, lng: -79.66319295242181}
                ] 
            },
            { 
                id: "DV", code: "DV", name: "(William G. Davis Building)", img: "artwork/DV.jpg",
                polygon: [
                    { lat: 43.54840290703774, lng: -79.66054431182486},
                    { lat: 43.54751076825081, lng: -79.66082235308757},
                    { lat: 43.54761039861765, lng: -79.66200949555723},
                    { lat: 43.54784588792241, lng: -79.66259057055314},
                    { lat: 43.548464042966486, lng: -79.66247810442442}, // Davis is huge, you will probably need 8-10 corners for this one!
                    { lat: 43.5484323428698, lng: -79.66202199179146},
                    { lat: 43.54888140648414, lng: -79.66284339174538}, 
                    { lat: 43.54903692866812, lng: -79.66339056238577}, 
                    { lat: 43.54937706922062, lng: -79.66329697898665}, 
                    { lat: 43.549533290466776, lng: -79.6626137734294},
                    { lat: 43.54948696592879, lng: -79.66234791428154}, 
                    { lat: 43.54913937760763, lng: -79.66224092044743},
                    { lat: 43.54882501453017, lng: -79.66177017955752},
                    { lat: 43.548726045278464, lng: -79.66176730483724},
                    { lat: 43.548629159430256, lng: -79.66124841778715}
                ] 
            },
            { 
                id: "KN", code: "KN", name: "(Kaneff Centre)", img: "artwork/KN.jpg",
                polygon: [
                    { lat: 43.5486469408775, lng: -79.66265847133569},
                    { lat: 43.54871134049466, lng: -79.66324095136486},
                    { lat: 43.548673774059665, lng: -79.66344333849364},
                    { lat: 43.548582541191486, lng: -79.66357908595805},
                    { lat: 43.548131741462974, lng: -79.66359142663663},
                    { lat: 43.548131741462974, lng: -79.66359883104379},
                    { lat: 43.548047663362766, lng: -79.66350997815798},
                    { lat: 43.54797968523856, lng: -79.66283370897156}
                ] 
            },
            { 
                id: "HB", code: "HB", name: "(Terrence Donnelly Health Sciences Complex)", img: "artwork/HB.jpg",
                polygon: [
                    { lat: 43.54942500377313, lng: -79.66162226954853},
                    { lat: 43.549713522473915, lng: -79.66155688468751},
                    { lat: 43.54982084550292, lng: -79.66233765685145},
                    { lat: 43.5495309335049, lng: -79.66240304171247}
                ] 
            },
            { 
                id: "LIB", code: "Library", name: "(U of T Mississauga Library)", img: "artwork/LIB.jpg",
                polygon: [
                    { lat: 43.55053743722536, lng: -79.66258697021514},
                    { lat: 43.55061988276196, lng: -79.66325502014183},
                    { lat: 43.55113853755128, lng: -79.66312471938214},
                    { lat: 43.55104859773427, lng: -79.66247735211573}
                ] 
            },
            { 
                id: "DH", code: "DH", name: "(Deerfield Hall)", img: "artwork/DH.jpg",
                polygon: [
                    { lat: 43.550761988694575, lng: -79.66663919346334},
                    { lat: 43.55049263427423, lng: -79.66580408893617},
                    { lat: 43.55009441004154, lng: -79.66600667101169},
                    { lat: 43.550371160316374, lng: -79.66685634978892}
                ] 
            },
            { 
                id: "SCI", code: "", name: "The Science Building", img: "artwork/SCI.jpg",
                polygon: [
                    { lat: 43.548661910064794, lng: -79.66122908713938},
                    { lat: 43.5488676845769, lng: -79.66173600325891},
                    { lat: 43.548735536295055, lng: -79.66176437997524},
                    { lat: 43.54865955463991, lng: -79.66123717740578}
                ] 
            }
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
                    await fb.updateUserLocation(detectedBuilding.code);
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
            // Check if they are inside the specific polygon
            if (this.isPointInPolygon({ lat, lng }, building.polygon)) {
                return building; 
            }
        }
        return null;
    }

    // The Ray-Casting Algorithm: Checks if a GPS coordinate is inside an irregular polygon
    isPointInPolygon(point, polygon) {
        let x = point.lng, y = point.lat;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i].lng, yi = polygon[i].lat;
            let xj = polygon[j].lng, yj = polygon[j].lat;
            
            let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // Keep Haversine just for the massive 1km "General Campus" circle
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; 
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
            this.heroImg.src = "artwork/campus.jpg"; // Fallback image for general campus
            this.subtitle.style.display = "none";
            this.listContainer.innerHTML = '';
            if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }

        } else {
            // THEY ARE IN A BUILDING!
            this.mainTitle.innerHTML = `Welcome to<br><span style="font-weight: 800">${locationData.code}</span> ${locationData.name}`;
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
                    <div class="uc-profile-info" style="cursor: pointer;" title="View Profile">
                        <img src="${u.avatar || 'artwork/Default_Profile_Icon.png'}" class="uc-avatar" alt="${u.name}'s avatar">
                        <div><div class="uc-name">${u.name}</div></div>
                    </div>
                    <div class="uc-actions">${actionButtonHTML}</div>
                </div>
                <div class="badges-scroll">${badgesHTML || '<span style="font-size:11px;color:#888;">No badges yet</span>'}</div>
            `;

            const addBtn = card.querySelector('.btn-add');
            if (addBtn) addBtn.addEventListener('click', (e) => this.addFriend(u.uid, e.target));
            // Make the entire left side of the card clickable!
            const profileClickZone = card.querySelector('.uc-profile-info');
            if (profileClickZone) {
                profileClickZone.addEventListener('click', () => {
                    window.app.viewUserController.showProfile(u.uid);
                });
            }
            this.listContainer.appendChild(card);
        });
    }

    async addFriend(friendUid, btnElement) {
        btnElement.disabled = true;
        btnElement.textContent = 'Sending...';
        await fb.sendFriendRequest(friendUid);
    }
}