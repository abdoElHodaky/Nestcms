{{/*
Expand the name of the chart.
*/}}
{{- define "nestcms.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "nestcms.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "nestcms.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "nestcms.labels" -}}
helm.sh/chart: {{ include "nestcms.chart" . }}
{{ include "nestcms.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "nestcms.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nestcms.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "nestcms.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "nestcms.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
MongoDB connection string
*/}}
{{- define "nestcms.mongodbUri" -}}
{{- if .Values.mongodb.enabled }}
{{- printf "mongodb://%s:%s@%s-mongodb:27017/%s" .Values.mongodb.auth.username .Values.mongodb.auth.password .Release.Name .Values.mongodb.auth.database }}
{{- else if .Values.externalMongodb.uri }}
{{- .Values.externalMongodb.uri }}
{{- else }}
{{- printf "mongodb://%s:%s@%s:%d/%s" .Values.externalMongodb.username .Values.externalMongodb.password .Values.externalMongodb.host (.Values.externalMongodb.port | int) .Values.externalMongodb.database }}
{{- end }}
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "nestcms.redisUri" -}}
{{- if .Values.redis.enabled }}
{{- printf "redis://:%s@%s-redis-master:6379" .Values.redis.auth.password .Release.Name }}
{{- end }}
{{- end }}

