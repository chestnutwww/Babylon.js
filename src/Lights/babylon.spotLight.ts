﻿module BABYLON {
    export class SpotLight extends ShadowLight {
        /**
            upVector , rightVector and direction will form the coordinate system for this spot light. 
            These three vectors will be used as projection matrix when doing texture projection.
            
            Also we have the following rules always holds:
            direction cross up   = right
            right cross dirction = up
            up cross right       = forward

            light_near and light_far will control the range of the texture projection. If a plane is 
            out of the range in spot light space, there is no texture projection.

            Warning:
            Change the angle of the Spotlight, direction of the SpotLight will not re-compute the 
            projection matrix. Need to call computeTextureMatrix() to recompute manually. Add inheritance
            to the setting function of the 2 attributes will solve the problem.
        */

        protected _light_far  :number;
        @serialize()
        /**
         * Allows reading the far clip of the Spotlight for texture projection.
         */
        public get light_far(): number {
            return this._light_far;
        }
        /**
         * Allows setting the far clip of the Spotlight for texture projection.
         */
        public set light_far(value: number) {
            this._light_far = value;
            this.computeTextureMatrix();
        }

        protected _light_near :number;
        @serialize()
        /**
         * Allows reading the near clip of the Spotlight for texture projection.
         */
        public get light_near(): number {
            return this._light_near;
        }
        /**
         * Allows setting the near clip of the Spotlight for texture projection.
         */
        public set light_near(value: number) {
            this._light_near = value;
            this.computeTextureMatrix();
        }
        /**
         * Main function for light texture projection matrix computing.
         */
        public computeTextureMatrix(): void{    
            /*
            var T = Matrix.Zero();
            Matrix.TranslationToRef(-this.position.x, -this.position.y, -this.position.z, T);

            if ((Math.abs(Vector3.Dot(this.direction, this.upVector)) > 0 ) ||  (Math.abs(Vector3.Dot(this.direction, this.rightVector)) > 0 )){
                this.upVector = Vector3.Normalize(new Vector3(-this.direction.z,0,this.direction.x));
                if (this.upVector.length() === 0){
                    this.upVector = Vector3.Normalize(new Vector3(this.direction.y,-this.direction.x,0));
                }
            }

            var F = Vector3.Normalize(this.direction);
            var U = Vector3.Normalize(this.upVector);
            var R = Vector3.Normalize(this.rightVector);

            var O = Matrix.Zero();
            Matrix.FromValuesToRef(R.x, U.x, F.x, 0.0,
                R.y, U.y, F.y, 0.0,
                R.z, U.z, F.z, 0.0,
                0.0, 0.0, 0.0, 1.0, O);                
            var viewLightMatrix = Matrix.Zero();
            viewLightMatrix.copyFrom(T);
            viewLightMatrix.multiplyToRef(O,viewLightMatrix);
            */

            var viewLightMatrix = Matrix.Zero();
            Matrix.LookAtLHToRef(this.position, this.position.add(this.direction), Vector3.Up(), viewLightMatrix);

            var light_far = this.light_far;
            var light_near = this.light_near;

            var P = light_far / (light_far - light_near);
            var Q = - P * light_near;
            var S = 1.0 / Math.tan(this._angle / 2.0);
            var A = 1.0;
            
            var projectionLightMatrix = Matrix.Zero();
            Matrix.FromValuesToRef(S/A, 0.0, 0.0, 0.0,
                0.0, S, 0.0, 0.0,
                0.0, 0.0, P, 1.0,
                0.0, 0.0, Q, 0.0, projectionLightMatrix);

            var scaleMatrix = Matrix.Zero();
            Matrix.FromValuesToRef(0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0, scaleMatrix);
                
            this._textureMatrix.copyFrom(viewLightMatrix);
            this._textureMatrix.multiplyToRef(projectionLightMatrix, this._textureMatrix);
            this._textureMatrix.multiplyToRef(scaleMatrix, this._textureMatrix);
        }

        private _angle: number;
        @serialize()
        public get angle(): number {
            return this._angle
        }
        public set angle(value: number) {
            this._angle = value;
            this.forceProjectionMatrixCompute();
        }

        private _shadowAngleScale: number;
        @serialize()
        /**
         * Allows scaling the angle of the light for shadow generation only.
         */
        public get shadowAngleScale(): number {
            return this._shadowAngleScale
        }
        /**
         * Allows scaling the angle of the light for shadow generation only.
         */
        public set shadowAngleScale(value: number) {
            this._shadowAngleScale = value;
            this.forceProjectionMatrixCompute();
        }
        @serialize()
        public exponent: number;

        //========================================================
        private _textureMatrix = Matrix.Zero();
        @serialize()
        /**
        * Allows reading the projecton texture
        */
        public get textureMatrix(): Matrix{
            return this._textureMatrix;
        }
        /**
        * Allows setting the value of projection texture
        */
        public set textureMatrix(value: Matrix) {
            this._textureMatrix = value;
            this.computeTextureMatrix();
        }

        //=================||=====================================
        
        /**
         * Creates a SpotLight object in the scene with the passed parameters :   
         * - `position` (Vector3) is the initial SpotLight position,  
         * - `direction` (Vector3) is the initial SpotLight direction,  
         * - `angle` (float, in radians) is the spot light cone angle,
         * - `exponent` (float) is the light decay speed with the distance from the emission spot.  
         * A spot light is a simply light oriented cone.   
         * It can cast shadows.  
         * Documentation : http://doc.babylonjs.com/tutorials/lights  
         */
        constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponent: number, scene: Scene) {
            super(name, scene);

            this.position = position;
            this.direction = direction;
            this.angle = angle;
            this.exponent = exponent;
//Remember to remove this after testing
//            this.projectionTexture = new BABYLON.StandardMaterial("ground", scene); 
            //Material test
            this.light_far = 1000.0;
            this.light_near = 1e-7;
            this.computeTextureMatrix();
        }

        /**
         * Returns the string "SpotLight".
         */
        public getClassName(): string {
            return "SpotLight";
        }

        /**
         * Returns the integer 2.
         */
        public getTypeID(): number {
            return Light.LIGHTTYPEID_SPOTLIGHT;
        }

        /**
         * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.  
         * Returns the SpotLight.  
         */
        protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
            var activeCamera = this.getScene().activeCamera;

            if (!activeCamera) {
                return;
            }

            this._shadowAngleScale = this._shadowAngleScale || 1;
            var angle = this._shadowAngleScale * this._angle;
            
            Matrix.PerspectiveFovLHToRef(angle, 1.0, 
            this.getDepthMinZ(activeCamera), this.getDepthMaxZ(activeCamera), matrix);
        }

        protected _buildUniformLayout(): void {
            this._uniformBuffer.addUniform("vLightData", 4);
            this._uniformBuffer.addUniform("vLightDiffuse", 4);
            this._uniformBuffer.addUniform("vLightSpecular", 3);
            this._uniformBuffer.addUniform("vLightDirection", 3);
            this._uniformBuffer.addUniform("shadowsInfo", 3);
            this._uniformBuffer.addUniform("depthValues", 2);
            this._uniformBuffer.addUniform("textureProjectionFlag",2);
            //=======================================
            //this._uniformBuffer.addUniform("textureMatrix", 16);
            //this._uniformBuffer.addUniform("tester", 2);

            this._uniformBuffer.create();
        }

        /**
         * Sets the passed Effect object with the SpotLight transfomed position (or position if not parented) and normalized direction.  
         * Return the SpotLight.   
         */
        public transferToEffect(effect: Effect, lightIndex: string): SpotLight {
            var normalizeDirection;

            if (this.computeTransformedInformation()) {
                this._uniformBuffer.updateFloat4("vLightData",
                    this.transformedPosition.x,
                    this.transformedPosition.y,
                    this.transformedPosition.z,
                    this.exponent,
                    lightIndex);

                normalizeDirection = Vector3.Normalize(this.transformedDirection);
            } else {
                this._uniformBuffer.updateFloat4("vLightData",
                    this.position.x,
                    this.position.y,
                    this.position.z,
                    this.exponent,
                    lightIndex);

                normalizeDirection = Vector3.Normalize(this.direction);
            }

            this._uniformBuffer.updateFloat4("vLightDirection",
                normalizeDirection.x,
                normalizeDirection.y,
                normalizeDirection.z,
                Math.cos(this.angle * 0.5),
                lightIndex);

            //=======================================
            effect.setMatrix("textureMatrix" + lightIndex, this._textureMatrix);
            if (this.projectedLightTexture){
                effect.setTexture("projectionLightSampler" + lightIndex, this.projectedLightTexture);
            }
            return this;
        }
    }
}